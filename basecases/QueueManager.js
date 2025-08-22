class QueueManager {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 5;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.retryBackoff = options.retryBackoff || 2;
    this.jobTimeout = options.jobTimeout || 30000;
    this.enablePriority = options.enablePriority !== false;
    this.enableScheduling = options.enableScheduling !== false;
    this.enablePersistence = options.enablePersistence || false;
    this.cleanupInterval = options.cleanupInterval || 60000;
    this.maxQueueSize = options.maxQueueSize || 10000;

    this.queues = new Map();
    this.runningJobs = new Map();
    this.scheduledJobs = new Map();
    this.failedJobs = new Map();
    this.completedJobs = new Map();
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      runningJobs: 0,
      queuedJobs: 0,
    };

    this.workers = new Map();
    this.eventBus = options.eventBus || null;
    this.storage = options.storage || null;
    this.serializer = options.serializer || JSON;

    this.cleanupTimer = null;
    this.schedulerTimer = null;

    this.startCleanup();
    if (this.enableScheduling) {
      this.startScheduler();
    }
  }

  createQueue(name, options = {}) {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const queue = {
      name,
      jobs: [],
      processing: false,
      concurrency: options.concurrency || this.maxConcurrency,
      running: 0,
      options: {
        priority: options.priority !== false,
        retries: options.retries || this.maxRetries,
        timeout: options.timeout || this.jobTimeout,
        ...options,
      },
    };

    this.queues.set(name, queue);
    this.stats.queuedJobs += queue.jobs.length;

    if (this.eventBus) {
      this.eventBus.emit("queue:created", { name, options });
    }

    return queue;
  }

  addJob(queueName, job, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' does not exist`);
    }

    if (queue.jobs.length >= this.maxQueueSize) {
      throw new Error(`Queue '${queueName}' is full`);
    }

    const jobId = this.generateId();
    const jobData = {
      id: jobId,
      queue: queueName,
      data: job,
      priority: options.priority || 0,
      retries: 0,
      maxRetries: options.maxRetries || queue.options.retries,
      timeout: options.timeout || queue.options.timeout,
      delay: options.delay || 0,
      scheduledFor: options.scheduledFor || null,
      metadata: options.metadata || {},
      createdAt: Date.now(),
      status: "queued",
    };

    if (jobData.scheduledFor && this.enableScheduling) {
      this.scheduleJob(jobData);
    } else if (jobData.delay > 0) {
      this.delayJob(jobData);
    } else {
      this.enqueueJob(queue, jobData);
    }

    this.stats.totalJobs++;
    this.stats.queuedJobs++;

    if (this.eventBus) {
      this.eventBus.emit("job:added", { job: jobData, queue: queueName });
    }

    if (this.enablePersistence && this.storage) {
      this.persistJob(jobData);
    }

    this.processQueue(queueName);

    return jobId;
  }

  enqueueJob(queue, jobData) {
    if (queue.options.priority) {
      const insertIndex = queue.jobs.findIndex(
        (job) => job.priority < jobData.priority
      );
      if (insertIndex === -1) {
        queue.jobs.push(jobData);
      } else {
        queue.jobs.splice(insertIndex, 0, jobData);
      }
    } else {
      queue.jobs.push(jobData);
    }
  }

  scheduleJob(jobData) {
    const scheduledTime = new Date(jobData.scheduledFor).getTime();
    const now = Date.now();

    if (scheduledTime <= now) {
      const queue = this.queues.get(jobData.queue);
      this.enqueueJob(queue, jobData);
    } else {
      this.scheduledJobs.set(jobData.id, jobData);
    }
  }

  delayJob(jobData) {
    setTimeout(() => {
      const queue = this.queues.get(jobData.queue);
      this.enqueueJob(queue, jobData);
      this.processQueue(jobData.queue);
    }, jobData.delay);
  }

  processQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue || queue.processing || queue.running >= queue.concurrency) {
      return;
    }

    queue.processing = true;

    while (queue.jobs.length > 0 && queue.running < queue.concurrency) {
      const jobData = queue.jobs.shift();
      this.executeJob(jobData);
    }

    queue.processing = false;
  }

  async executeJob(jobData) {
    const queue = this.queues.get(jobData.queue);
    if (!queue) return;

    queue.running++;
    this.runningJobs.set(jobData.id, jobData);
    this.stats.runningJobs++;
    this.stats.queuedJobs--;

    jobData.status = "running";
    jobData.startedAt = Date.now();

    if (this.eventBus) {
      this.eventBus.emit("job:started", { job: jobData });
    }

    const timeoutId = setTimeout(() => {
      this.handleJobTimeout(jobData);
    }, jobData.timeout);

    try {
      const result = await this.runJob(jobData);
      clearTimeout(timeoutId);

      jobData.status = "completed";
      jobData.completedAt = Date.now();
      jobData.result = result;

      this.completedJobs.set(jobData.id, jobData);
      this.stats.completedJobs++;

      if (this.eventBus) {
        this.eventBus.emit("job:completed", { job: jobData, result });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      await this.handleJobError(jobData, error);
    } finally {
      queue.running--;
      this.runningJobs.delete(jobData.id);
      this.stats.runningJobs--;

      if (this.enablePersistence && this.storage) {
        this.removePersistedJob(jobData.id);
      }

      this.processQueue(jobData.queue);
    }
  }

  async runJob(jobData) {
    if (typeof jobData.data === "function") {
      return await jobData.data(jobData);
    }

    const worker = this.workers.get(jobData.queue);
    if (worker && typeof worker === "function") {
      return await worker(jobData.data, jobData);
    }

    throw new Error(`No worker found for queue '${jobData.queue}'`);
  }

  async handleJobError(jobData, error) {
    jobData.lastError = error.message;
    jobData.lastErrorAt = Date.now();

    if (jobData.retries < jobData.maxRetries) {
      jobData.retries++;
      jobData.status = "retrying";

      const delay =
        this.retryDelay * Math.pow(this.retryBackoff, jobData.retries - 1);

      if (this.eventBus) {
        this.eventBus.emit("job:retrying", { job: jobData, error, delay });
      }

      setTimeout(() => {
        const queue = this.queues.get(jobData.queue);
        this.enqueueJob(queue, jobData);
        this.processQueue(jobData.queue);
      }, delay);
    } else {
      jobData.status = "failed";
      jobData.failedAt = Date.now();

      this.failedJobs.set(jobData.id, jobData);
      this.stats.failedJobs++;

      if (this.eventBus) {
        this.eventBus.emit("job:failed", { job: jobData, error });
      }
    }
  }

  handleJobTimeout(jobData) {
    const error = new Error(`Job timeout after ${jobData.timeout}ms`);
    this.handleJobError(jobData, error);
  }

  addWorker(queueName, worker) {
    if (typeof worker !== "function") {
      throw new Error("Worker must be a function");
    }

    this.workers.set(queueName, worker);

    if (this.eventBus) {
      this.eventBus.emit("worker:added", { queue: queueName });
    }
  }

  removeWorker(queueName) {
    this.workers.delete(queueName);

    if (this.eventBus) {
      this.eventBus.emit("worker:removed", { queue: queueName });
    }
  }

  getJobStatus(jobId) {
    if (this.runningJobs.has(jobId)) {
      return this.runningJobs.get(jobId);
    }
    if (this.completedJobs.has(jobId)) {
      return this.completedJobs.get(jobId);
    }
    if (this.failedJobs.has(jobId)) {
      return this.failedJobs.get(jobId);
    }
    if (this.scheduledJobs.has(jobId)) {
      return this.scheduledJobs.get(jobId);
    }

    for (const queue of this.queues.values()) {
      const job = queue.jobs.find((j) => j.id === jobId);
      if (job) return job;
    }

    return null;
  }

  cancelJob(jobId) {
    const job = this.getJobStatus(jobId);
    if (!job) return false;

    if (job.status === "running") {
      return false;
    }

    if (job.status === "queued") {
      const queue = this.queues.get(job.queue);
      const index = queue.jobs.findIndex((j) => j.id === jobId);
      if (index !== -1) {
        queue.jobs.splice(index, 1);
        this.stats.queuedJobs--;
      }
    }

    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.delete(jobId);
    }

    job.status = "cancelled";
    job.cancelledAt = Date.now();

    if (this.eventBus) {
      this.eventBus.emit("job:cancelled", { job });
    }

    return true;
  }

  retryJob(jobId) {
    const job = this.failedJobs.get(jobId);
    if (!job) return false;

    job.retries = 0;
    job.status = "queued";
    job.lastError = null;
    job.lastErrorAt = null;
    job.failedAt = null;

    this.failedJobs.delete(jobId);
    this.stats.failedJobs--;

    const queue = this.queues.get(job.queue);
    this.enqueueJob(queue, job);
    this.stats.queuedJobs++;

    this.processQueue(job.queue);

    if (this.eventBus) {
      this.eventBus.emit("job:retried", { job });
    }

    return true;
  }

  getQueueStats(queueName = null) {
    if (queueName) {
      const queue = this.queues.get(queueName);
      if (!queue) return null;

      return {
        name: queueName,
        jobs: queue.jobs.length,
        running: queue.running,
        concurrency: queue.concurrency,
        processing: queue.processing,
      };
    }

    const stats = {};
    for (const [name, queue] of this.queues) {
      stats[name] = {
        name,
        jobs: queue.jobs.length,
        running: queue.running,
        concurrency: queue.concurrency,
        processing: queue.processing,
      };
    }
    return stats;
  }

  getGlobalStats() {
    return {
      ...this.stats,
      queues: this.queues.size,
      workers: this.workers.size,
      scheduledJobs: this.scheduledJobs.size,
    };
  }

  clearQueue(queueName, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    const clearedJobs = queue.jobs.length;
    queue.jobs = [];
    this.stats.queuedJobs -= clearedJobs;

    if (this.eventBus) {
      this.eventBus.emit("queue:cleared", { queue: queueName, clearedJobs });
    }

    return clearedJobs;
  }

  clearCompletedJobs() {
    const clearedCount = this.completedJobs.size;
    this.completedJobs.clear();
    this.stats.completedJobs = 0;

    if (this.eventBus) {
      this.eventBus.emit("jobs:cleared", {
        type: "completed",
        count: clearedCount,
      });
    }

    return clearedCount;
  }

  clearFailedJobs() {
    const clearedCount = this.failedJobs.size;
    this.failedJobs.clear();
    this.stats.failedJobs = 0;

    if (this.eventBus) {
      this.eventBus.emit("jobs:cleared", {
        type: "failed",
        count: clearedCount,
      });
    }

    return clearedCount;
  }

  startScheduler() {
    this.schedulerTimer = setInterval(() => {
      this.processScheduledJobs();
    }, 1000);
  }

  stopScheduler() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  processScheduledJobs() {
    const now = Date.now();
    const jobsToProcess = [];

    for (const [jobId, jobData] of this.scheduledJobs) {
      if (new Date(jobData.scheduledFor).getTime() <= now) {
        jobsToProcess.push({ jobId, jobData });
      }
    }

    for (const { jobId, jobData } of jobsToProcess) {
      this.scheduledJobs.delete(jobId);
      const queue = this.queues.get(jobData.queue);
      this.enqueueJob(queue, jobData);
      this.stats.queuedJobs++;
    }

    if (jobsToProcess.length > 0) {
      for (const { jobData } of jobsToProcess) {
        this.processQueue(jobData.queue);
      }
    }
  }

  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    for (const [jobId, jobData] of this.completedJobs) {
      if (now - jobData.completedAt > maxAge) {
        this.completedJobs.delete(jobId);
        this.stats.completedJobs--;
      }
    }

    for (const [jobId, jobData] of this.failedJobs) {
      if (now - jobData.failedAt > maxAge) {
        this.failedJobs.delete(jobId);
        this.stats.failedJobs--;
      }
    }
  }

  persistJob(jobData) {
    if (!this.storage) return;

    try {
      const key = `job_${jobData.id}`;
      this.storage.setItem(key, this.serializer.stringify(jobData));
    } catch (error) {
      console.warn("Failed to persist job:", error);
    }
  }

  removePersistedJob(jobId) {
    if (!this.storage) return;

    try {
      const key = `job_${jobId}`;
      this.storage.removeItem(key);
    } catch (error) {
      console.warn("Failed to remove persisted job:", error);
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  destroy() {
    this.stopCleanup();
    this.stopScheduler();

    this.queues.clear();
    this.runningJobs.clear();
    this.scheduledJobs.clear();
    this.failedJobs.clear();
    this.completedJobs.clear();
    this.workers.clear();

    if (this.eventBus) {
      this.eventBus.emit("queue:destroyed");
    }
  }
}

export default QueueManager;
