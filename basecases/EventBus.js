class EventBus {
    constructor(options = {}) {
        this.events = new Map();
        this.middleware = [];
        this.eventQueue = [];
        this.isProcessing = false;
        this.maxQueueSize = options.maxQueueSize || 1000;
        this.processDelay = options.processDelay || 0;
        this.enableLogging = options.enableLogging || false;
        this.eventHistory = [];
        this.maxHistorySize = options.maxHistorySize || 100;
        this.priorityLevels = {
            LOW: 0,
            NORMAL: 1,
            HIGH: 2,
            CRITICAL: 3
        };
        this.defaultPriority = this.priorityLevels.NORMAL;
        this.eventCounters = new Map();
        this.errorHandlers = new Set();
        this.asyncEventHandlers = new Map();
        this.eventTimeouts = new Map();
        this.maxEventTimeout = options.maxEventTimeout || 30000;
    }

    on(eventName, handler, options = {}) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const eventHandler = {
            id: this.generateId(),
            handler,
            priority: options.priority || this.defaultPriority,
            once: options.once || false,
            timeout: options.timeout || this.maxEventTimeout,
            context: options.context || null,
            metadata: options.metadata || {}
        };
        
        const handlers = this.events.get(eventName);
        handlers.push(eventHandler);
        
        handlers.sort((a, b) => b.priority - a.priority);
        
        if (this.enableLogging) {
            this.logEvent('subscribe', eventName, eventHandler);
        }
        
        return eventHandler.id;
    }

    once(eventName, handler, options = {}) {
        return this.on(eventName, handler, { ...options, once: true });
    }

    off(eventName, handlerId = null) {
        if (!this.events.has(eventName)) return false;
        
        if (handlerId) {
            const handlers = this.events.get(eventName);
            const index = handlers.findIndex(h => h.id === handlerId);
            if (index !== -1) {
                handlers.splice(index, 1);
                if (handlers.length === 0) {
                    this.events.delete(eventName);
                }
                return true;
            }
            return false;
        } else {
            this.events.delete(eventName);
            return true;
        }
    }

    emit(eventName, data = null, options = {}) {
        const event = {
            id: this.generateId(),
            name: eventName,
            data,
            timestamp: Date.now(),
            priority: options.priority || this.defaultPriority,
            source: options.source || 'manual',
            metadata: options.metadata || {},
            retryCount: 0,
            maxRetries: options.maxRetries || 0
        };
        
        if (this.enableLogging) {
            this.logEvent('emit', eventName, event);
        }
        
        this.recordEventHistory(event);
        this.incrementEventCounter(eventName);
        
        if (this.middleware.length > 0) {
            this.processMiddleware(event, () => this.processEvent(event));
        } else {
            this.processEvent(event);
        }
        
        return event.id;
    }

    emitAsync(eventName, data = null, options = {}) {
        return new Promise((resolve, reject) => {
            const eventId = this.emit(eventName, data, {
                ...options,
                async: true,
                resolve,
                reject
            });
            
            this.asyncEventHandlers.set(eventId, { resolve, reject });
            
            if (options.timeout) {
                this.setEventTimeout(eventId, options.timeout, reject);
            }
        });
    }

    processEvent(event) {
        if (!this.events.has(event.name)) {
            if (event.async && this.asyncEventHandlers.has(event.id)) {
                const { resolve } = this.asyncEventHandlers.get(event.id);
                resolve(null);
                this.asyncEventHandlers.delete(event.id);
            }
            return;
        }
        
        const handlers = this.events.get(event.name);
        const results = [];
        let hasErrors = false;
        
        for (const handler of handlers) {
            try {
                if (handler.timeout) {
                    this.setEventTimeout(event.id, handler.timeout, () => {
                        this.handleHandlerTimeout(event, handler);
                    });
                }
                
                const result = handler.handler.call(handler.context, event.data, event);
                results.push({ handler, result, success: true });
                
                if (handler.once) {
                    this.off(event.name, handler.id);
                }
                
                if (event.async && this.asyncEventHandlers.has(event.id)) {
                    const { resolve } = this.asyncEventHandlers.get(event.id);
                    resolve(result);
                    this.asyncEventHandlers.delete(event.id);
                }
                
            } catch (error) {
                hasErrors = true;
                results.push({ handler, error, success: false });
                this.handleHandlerError(error, event, handler);
            }
        }
        
        if (hasErrors && this.errorHandlers.size > 0) {
            this.notifyErrorHandlers(event, results.filter(r => !r.success));
        }
        
        return results;
    }

    processMiddleware(event, next) {
        let index = 0;
        
        const executeMiddleware = () => {
            if (index >= this.middleware.length) {
                return next();
            }
            
            const middleware = this.middleware[index++];
            try {
                middleware(event, executeMiddleware);
            } catch (error) {
                this.handleHandlerError(error, event, null);
                next();
            }
        };
        
        executeMiddleware();
    }

    use(middleware) {
        if (typeof middleware === 'function') {
            this.middleware.push(middleware);
        }
        return this;
    }

    addErrorHandler(handler) {
        this.errorHandlers.add(handler);
        return this;
    }

    removeErrorHandler(handler) {
        this.errorHandlers.delete(handler);
        return this;
    }

    handleHandlerError(error, event, handler) {
        if (this.enableLogging) {
            console.error(`EventBus error in event '${event.name}':`, error);
        }
        
        for (const errorHandler of this.errorHandlers) {
            try {
                errorHandler(error, event, handler);
            } catch (handlerError) {
                console.error('Error in error handler:', handlerError);
            }
        }
    }

    handleHandlerTimeout(event, handler) {
        const error = new Error(`Handler timeout for event '${event.name}'`);
        this.handleHandlerError(error, event, handler);
    }

    setEventTimeout(eventId, timeout, callback) {
        if (this.eventTimeouts.has(eventId)) {
            clearTimeout(this.eventTimeouts.get(eventId));
        }
        
        const timeoutId = setTimeout(() => {
            this.eventTimeouts.delete(eventId);
            callback();
        }, timeout);
        
        this.eventTimeouts.set(eventId, timeoutId);
    }

    emitWithPriority(eventName, data, priority) {
        return this.emit(eventName, data, { priority });
    }

    emitCritical(eventName, data) {
        return this.emit(eventName, data, { priority: this.priorityLevels.CRITICAL });
    }

    emitLow(eventName, data) {
        return this.emit(eventName, data, { priority: this.priorityLevels.LOW });
    }

    queueEvent(eventName, data, options = {}) {
        if (this.eventQueue.length >= this.maxQueueSize) {
            this.eventQueue.shift();
        }
        
        const queuedEvent = {
            eventName,
            data,
            options,
            timestamp: Date.now(),
            priority: options.priority || this.defaultPriority
        };
        
        this.eventQueue.push(queuedEvent);
        this.eventQueue.sort((a, b) => b.priority - a.priority);
        
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    processQueue() {
        if (this.eventQueue.length === 0) {
            this.isProcessing = false;
            return;
        }
        
        this.isProcessing = true;
        const event = this.eventQueue.shift();
        
        this.emit(event.eventName, event.data, event.options);
        
        if (this.processDelay > 0) {
            setTimeout(() => this.processQueue(), this.processDelay);
        } else {
            this.processQueue();
        }
    }

    clearQueue() {
        this.eventQueue = [];
        this.isProcessing = false;
    }

    getEventStats(eventName = null) {
        if (eventName) {
            const count = this.eventCounters.get(eventName) || 0;
            const handlers = this.events.get(eventName) || [];
            return { count, handlers: handlers.length };
        }
        
        const stats = {};
        for (const [name, handlers] of this.events) {
            const count = this.eventCounters.get(name) || 0;
            stats[name] = { count, handlers: handlers.length };
        }
        return stats;
    }

    getEventHistory(limit = null) {
        if (limit) {
            return this.eventHistory.slice(-limit);
        }
        return [...this.eventHistory];
    }

    recordEventHistory(event) {
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    incrementEventCounter(eventName) {
        const current = this.eventCounters.get(eventName) || 0;
        this.eventCounters.set(eventName, current + 1);
    }

    logEvent(action, eventName, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            eventName,
            details
        };
        
        if (this.enableLogging) {
            console.log('EventBus:', logEntry);
        }
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    destroy() {
        this.events.clear();
        this.middleware = [];
        this.eventQueue = [];
        this.eventHistory = [];
        this.eventCounters.clear();
        this.errorHandlers.clear();
        this.asyncEventHandlers.clear();
        
        for (const timeoutId of this.eventTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        this.eventTimeouts.clear();
    }
}

export default EventBus;
