class CacheManager {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 1000;
        this.defaultTTL = options.defaultTTL || 300000;
        this.cleanupInterval = options.cleanupInterval || 60000;
        this.enableLRU = options.enableLRU !== false;
        this.enableCompression = options.enableCompression || false;
        this.compressionThreshold = options.compressionThreshold || 1024;
        this.distributed = options.distributed || false;
        this.syncInterval = options.syncInterval || 5000;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        this.cache = new Map();
        this.accessOrder = [];
        this.size = 0;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            compressions: 0
        };
        
        this.cleanupTimer = null;
        this.syncTimer = null;
        this.eventBus = options.eventBus || null;
        this.storage = options.storage || null;
        this.serializer = options.serializer || JSON;
        
        this.startCleanup();
        if (this.distributed) {
            this.startSync();
        }
    }

    set(key, value, options = {}) {
        const ttl = options.ttl || this.defaultTTL;
        const priority = options.priority || 1;
        const tags = options.tags || [];
        const metadata = options.metadata || {};
        
        if (this.size >= this.maxSize && !this.hasKey(key)) {
            this.evict();
        }
        
        const cacheEntry = {
            value: this.compressValue(value),
            ttl: ttl,
            expiresAt: Date.now() + ttl,
            priority: priority,
            tags: tags,
            metadata: metadata,
            accessCount: 0,
            lastAccessed: Date.now(),
            createdAt: Date.now(),
            size: this.calculateSize(value)
        };
        
        if (this.hasKey(key)) {
            this.remove(key);
        }
        
        this.cache.set(key, cacheEntry);
        this.size++;
        this.updateAccessOrder(key);
        
        this.stats.sets++;
        
        if (this.eventBus) {
            this.eventBus.emit('cache:set', { key, entry: cacheEntry });
        }
        
        if (this.storage && options.persistent) {
            this.persistToStorage(key, cacheEntry);
        }
        
        return true;
    }

    get(key, options = {}) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        
        if (this.isExpired(entry)) {
            this.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.updateAccessStats(entry);
        this.updateAccessOrder(key);
        this.stats.hits++;
        
        const value = this.decompressValue(entry.value);
        
        if (options.refreshTTL && entry.ttl) {
            this.refreshTTL(key, entry.ttl);
        }
        
        if (this.eventBus) {
            this.eventBus.emit('cache:get', { key, entry });
        }
        
        return value;
    }

    has(key) {
        const entry = this.cache.get(key);
        if (!entry || this.isExpired(entry)) {
            return false;
        }
        return true;
    }

    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            this.size--;
            this.stats.deletes++;
            
            if (this.eventBus) {
                this.eventBus.emit('cache:delete', { key, entry });
            }
            
            if (this.storage) {
                this.removeFromStorage(key);
            }
            
            return true;
        }
        return false;
    }

    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.size = 0;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            compressions: 0
        };
        
        if (this.eventBus) {
            this.eventBus.emit('cache:clear');
        }
        
        if (this.storage) {
            this.clearStorage();
        }
    }

    getMultiple(keys) {
        const results = {};
        const missingKeys = [];
        
        for (const key of keys) {
            const value = this.get(key);
            if (value !== null) {
                results[key] = value;
            } else {
                missingKeys.push(key);
            }
        }
        
        return { results, missingKeys };
    }

    setMultiple(entries, options = {}) {
        const results = {};
        
        for (const [key, value] of Object.entries(entries)) {
            try {
                results[key] = this.set(key, value, options);
            } catch (error) {
                results[key] = false;
            }
        }
        
        return results;
    }

    deleteMultiple(keys) {
        const results = {};
        
        for (const key of keys) {
            results[key] = this.delete(key);
        }
        
        return results;
    }

    getByTag(tag) {
        const results = [];
        
        for (const [key, entry] of this.cache) {
            if (entry.tags.includes(tag) && !this.isExpired(entry)) {
                results.push({
                    key,
                    value: this.decompressValue(entry.value),
                    entry
                });
            }
        }
        
        return results;
    }

    deleteByTag(tag) {
        const keysToDelete = [];
        
        for (const [key, entry] of this.cache) {
            if (entry.tags.includes(tag)) {
                keysToDelete.push(key);
            }
        }
        
        return this.deleteMultiple(keysToDelete);
    }

    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
            : 0;
        
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100,
            size: this.size,
            maxSize: this.maxSize,
            memoryUsage: this.calculateMemoryUsage()
        };
    }

    warmCache(warmingStrategy) {
        if (typeof warmingStrategy === 'function') {
            const keys = warmingStrategy();
            for (const key of keys) {
                if (!this.has(key)) {
                    this.set(key, null, { ttl: 0 });
                }
            }
        }
    }

    prefetch(keys, fetcher) {
        const promises = keys.map(async (key) => {
            if (!this.has(key)) {
                try {
                    const value = await fetcher(key);
                    this.set(key, value);
                    return { key, success: true };
                } catch (error) {
                    return { key, success: false, error };
                }
            }
            return { key, success: true, cached: true };
        });
        
        return Promise.all(promises);
    }

    evict() {
        if (this.accessOrder.length === 0) return;
        
        let keyToEvict = null;
        
        if (this.enableLRU) {
            keyToEvict = this.accessOrder[0];
        } else {
            let lowestPriority = Infinity;
            let oldestTime = Date.now();
            
            for (const [key, entry] of this.cache) {
                if (entry.priority < lowestPriority || 
                    (entry.priority === lowestPriority && entry.createdAt < oldestTime)) {
                    lowestPriority = entry.priority;
                    oldestTime = entry.createdAt;
                    keyToEvict = key;
                }
            }
        }
        
        if (keyToEvict) {
            this.delete(keyToEvict);
            this.stats.evictions++;
        }
    }

    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        
        for (const [key, entry] of this.cache) {
            if (this.isExpired(entry)) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.delete(key);
        }
        
        if (this.size > this.maxSize * 0.9) {
            const evictionCount = Math.ceil(this.size * 0.1);
            for (let i = 0; i < evictionCount; i++) {
                this.evict();
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

    startSync() {
        this.syncTimer = setInterval(() => {
            this.syncWithStorage();
        }, this.syncInterval);
    }

    stopSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    syncWithStorage() {
        if (!this.storage) return;
        
        try {
            const storedData = this.storage.getItem('cache_data');
            if (storedData) {
                const parsed = this.serializer.parse(storedData);
                for (const [key, entry] of Object.entries(parsed)) {
                    if (!this.has(key) && !this.isExpired(entry)) {
                        this.cache.set(key, entry);
                        this.size++;
                        this.updateAccessOrder(key);
                    }
                }
            }
        } catch (error) {
            console.warn('Cache sync failed:', error);
        }
    }

    persistToStorage(key, entry) {
        if (!this.storage) return;
        
        try {
            const existing = this.storage.getItem('cache_data');
            const data = existing ? this.serializer.parse(existing) : {};
            data[key] = entry;
            this.storage.setItem('cache_data', this.serializer.stringify(data));
        } catch (error) {
            console.warn('Cache persistence failed:', error);
        }
    }

    removeFromStorage(key) {
        if (!this.storage) return;
        
        try {
            const existing = this.storage.getItem('cache_data');
            if (existing) {
                const data = this.serializer.parse(existing);
                delete data[key];
                this.storage.setItem('cache_data', this.serializer.stringify(data));
            }
        } catch (error) {
            console.warn('Cache removal failed:', error);
        }
    }

    clearStorage() {
        if (!this.storage) return;
        
        try {
            this.storage.removeItem('cache_data');
        } catch (error) {
            console.warn('Cache clear failed:', error);
        }
    }

    compressValue(value) {
        if (!this.enableCompression || !value) return value;
        
        const serialized = this.serializer.stringify(value);
        if (serialized.length > this.compressionThreshold) {
            this.stats.compressions++;
            return btoa(serialized);
        }
        
        return value;
    }

    decompressValue(value) {
        if (!this.enableCompression || !value || typeof value !== 'string') return value;
        
        try {
            if (value.length > this.compressionThreshold) {
                return this.serializer.parse(atob(value));
            }
        } catch (error) {
            return value;
        }
        
        return value;
    }

    calculateSize(value) {
        try {
            return new Blob([this.serializer.stringify(value)]).size;
        } catch (error) {
            return 0;
        }
    }

    calculateMemoryUsage() {
        let totalSize = 0;
        for (const entry of this.cache.values()) {
            totalSize += entry.size || 0;
        }
        return totalSize;
    }

    isExpired(entry) {
        return entry.expiresAt && Date.now() > entry.expiresAt;
    }

    hasKey(key) {
        return this.cache.has(key);
    }

    updateAccessStats(entry) {
        entry.accessCount++;
        entry.lastAccessed = Date.now();
    }

    updateAccessOrder(key) {
        this.removeFromAccessOrder(key);
        this.accessOrder.push(key);
    }

    removeFromAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    refreshTTL(key, ttl) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.expiresAt = Date.now() + ttl;
        }
    }

    destroy() {
        this.stopCleanup();
        this.stopSync();
        this.clear();
        
        if (this.eventBus) {
            this.eventBus.emit('cache:destroy');
        }
    }
}

export default CacheManager;
