class StateManager {
  constructor(initialState = {}, options = {}) {
    this.currentState = this.deepClone(initialState);
    this.initialState = this.deepClone(initialState);
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = options.maxHistorySize || 50;
    this.subscribers = new Map();
    this.changeTracking = new Map();
    this.persistentKeys = new Set(options.persistentKeys || []);
    this.storageKey = options.storageKey || "app_state";
    this.autoSave = options.autoSave !== false;
    this.debounceTimeout = null;
    this.debounceDelay = options.debounceDelay || 300;

    this.loadPersistentState();
  }

  deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => this.deepClone(item));
    if (typeof obj === "object") {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  }

  setState(path, value, options = {}) {
    const oldState = this.deepClone(this.currentState);
    const newState = this.updateNestedState(this.currentState, path, value);

    if (this.shouldTrackChange(path, oldState, newState)) {
      this.recordChange(path, oldState, newState, options);
      this.currentState = newState;
      this.notifySubscribers(path, oldState, newState);

      if (this.autoSave && options.persistent !== false) {
        this.debouncedSave();
      }
    }

    return this.currentState;
  }

  updateNestedState(state, path, value) {
    const newState = this.deepClone(state);
    const keys = path.split(".");
    let current = newState;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;

    return newState;
  }

  shouldTrackChange(path, oldState, newState) {
    const oldValue = this.getNestedValue(oldState, path);
    const newValue = this.getNestedValue(newState, path);

    if (oldValue === newValue) return false;
    if (oldValue === null && newValue === null) return false;
    if (oldValue === undefined && newValue === undefined) return false;

    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }

  recordChange(path, oldState, newState, options) {
    const change = {
      timestamp: Date.now(),
      path,
      oldValue: this.getNestedValue(oldState, path),
      newValue: this.getNestedValue(newState, path),
      metadata: options.metadata || {},
      type: options.type || "manual",
    };

    this.changeTracking.set(path, change);

    if (options.recordInHistory !== false) {
      this.addToHistory(oldState, change);
    }
  }

  addToHistory(oldState, change) {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({
      state: oldState,
      change,
      timestamp: Date.now(),
    });

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex < 0) return false;

    const historyItem = this.history[this.historyIndex];
    this.currentState = this.deepClone(historyItem.state);
    this.historyIndex--;

    this.notifySubscribers("undo", this.currentState, historyItem.change);
    return true;
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return false;

    this.historyIndex++;
    const historyItem = this.history[this.historyIndex];
    this.currentState = this.deepClone(historyItem.state);

    this.notifySubscribers("redo", this.currentState, historyItem.change);
    return true;
  }

  getState(path = null) {
    if (!path) return this.deepClone(this.currentState);
    return this.getNestedValue(this.currentState, path);
  }

  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  subscribe(path, callback, options = {}) {
    const subscriptionId = this.generateId();
    const subscription = {
      id: subscriptionId,
      path,
      callback,
      options: {
        immediate: options.immediate || false,
        once: options.once || false,
        ...options,
      },
    };

    this.subscribers.set(subscriptionId, subscription);

    if (subscription.options.immediate) {
      callback(this.getState(path), path, "immediate");
    }

    return subscriptionId;
  }

  unsubscribe(subscriptionId) {
    return this.subscribers.delete(subscriptionId);
  }

  notifySubscribers(path, oldState, newState) {
    const changeType = path === "undo" || path === "redo" ? path : "change";

    for (const [id, subscription] of this.subscribers) {
      if (this.shouldNotifySubscription(subscription, path)) {
        try {
          subscription.callback(newState, path, changeType);

          if (subscription.options.once) {
            this.subscribers.delete(id);
          }
        } catch (error) {
          console.error("StateManager subscriber error:", error);
        }
      }
    }
  }

  shouldNotifySubscription(subscription, path) {
    if (!subscription.path) return true;
    if (subscription.path === path) return true;
    if (path.startsWith(subscription.path + ".")) return true;
    return false;
  }

  resetToInitial() {
    const oldState = this.deepClone(this.currentState);
    this.currentState = this.deepClone(this.initialState);
    this.history = [];
    this.historyIndex = -1;
    this.changeTracking.clear();

    this.notifySubscribers("reset", this.currentState, {
      oldState,
      newState: this.currentState,
    });
    return this.currentState;
  }

  resetToState(targetState) {
    const oldState = this.deepClone(this.currentState);
    this.currentState = this.deepClone(targetState);
    this.history = [];
    this.historyIndex = -1;
    this.changeTracking.clear();

    this.notifySubscribers("reset", this.currentState, {
      oldState,
      newState: this.currentState,
    });
    return this.currentState;
  }

  getChangeHistory(path = null) {
    if (!path) return Array.from(this.changeTracking.values());
    return this.changeTracking.get(path) || null;
  }

  getHistoryStats() {
    return {
      totalChanges: this.history.length,
      currentIndex: this.historyIndex,
      canUndo: this.historyIndex >= 0,
      canRedo: this.historyIndex < this.history.length - 1,
      oldestChange: this.history[0]?.timestamp || null,
      newestChange: this.history[this.history.length - 1]?.timestamp || null,
    };
  }

  setPersistentKeys(keys) {
    this.persistentKeys = new Set(keys);
    this.savePersistentState();
  }

  savePersistentState() {
    if (typeof window === "undefined") return;

    const persistentState = {};
    for (const key of this.persistentKeys) {
      const value = this.getNestedValue(this.currentState, key);
      if (value !== undefined) {
        persistentState[key] = value;
      }
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(persistentState));
    } catch (error) {
      console.warn("Failed to save persistent state:", error);
    }
  }

  loadPersistentState() {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const persistentState = JSON.parse(saved);
        for (const [key, value] of Object.entries(persistentState)) {
          this.updateNestedState(this.currentState, key, value);
        }
      }
    } catch (error) {
      console.warn("Failed to load persistent state:", error);
    }
  }

  debouncedSave() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.savePersistentState();
      this.debounceTimeout = null;
    }, this.debounceDelay);
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  destroy() {
    this.subscribers.clear();
    this.changeTracking.clear();
    this.history = [];
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }
}

export default StateManager;
