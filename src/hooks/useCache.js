/**
 * LRU Cache hook with TTL (Time To Live) support.
 * @module hooks/useCache
 */

/**
 * Creates a cached function with LRU eviction and TTL expiration.
 * @param {Object} options - Cache configuration
 * @param {number} options.maxSize - Maximum number of entries (default: 100)
 * @param {number} options.ttlMs - Time to live in milliseconds (default: 5 minutes = 300000ms)
 * @returns {Object} Cache interface
 */
export function createCache(options = {}) {
    const maxSize = options.maxSize || 100;
    const ttlMs = options.ttlMs || 5 * 60 * 1000; // 5 minutes default

    const cache = new Map();
    const accessOrder = [];

    function removeOldest() {
        if (accessOrder.length === 0) {
            return;
        }
        const oldestKey = accessOrder.shift();
        cache.delete(oldestKey);
    }

    function updateAccessOrder(key) {
        const existingIndex = accessOrder.indexOf(key);
        if (existingIndex !== -1) {
            accessOrder.splice(existingIndex, 1);
        }
        accessOrder.push(key);
    }

    return {
        /**
         * Gets a value from cache if it exists and is not expired.
         * @param {string} key - Cache key
         * @returns {*|null} Cached value or null if not found/expired
         */
        get(key) {
            const entry = cache.get(key);

            if (!entry) {
                return null;
            }

            if (Date.now() > entry.expiresAt) {
                cache.delete(key);
                const index = accessOrder.indexOf(key);
                if (index !== -1) {
                    accessOrder.splice(index, 1);
                }
                return null;
            }

            updateAccessOrder(key);
            return entry.value;
        },

        /**
         * Sets a value in cache with TTL.
         * @param {string} key - Cache key
         * @param {*} value - Value to cache
         * @param {number} [customTtl] - Optional custom TTL for this entry
         */
        set(key, value, customTtl) {
            // Evict oldest if at capacity
            while (cache.size >= maxSize && accessOrder.length > 0) {
                removeOldest();
            }

            const effectiveTtl = customTtl || ttlMs;

            cache.set(key, {
                value,
                expiresAt: Date.now() + effectiveTtl,
            });

            updateAccessOrder(key);
        },

        /**
         * Checks if a key exists and is valid (not expired).
         * @param {string} key - Cache key
         * @returns {boolean}
         */
        has(key) {
            return this.get(key) !== null;
        },

        /**
         * Deletes a specific key from cache.
         * @param {string} key - Cache key
         */
        delete(key) {
            cache.delete(key);
            const index = accessOrder.indexOf(key);
            if (index !== -1) {
                accessOrder.splice(index, 1);
            }
        },

        /**
         * Clears all entries from cache.
         */
        clear() {
            cache.clear();
            accessOrder.length = 0;
        },

        /**
         * Gets current cache size.
         * @returns {number}
         */
        size() {
            return cache.size;
        },
    };
}

/**
 * Creates a memoized function with LRU cache.
 * @param {Function} fn - Function to memoize
 * @param {Object} options - Cache options
 * @param {number} options.maxSize - Max entries (default: 100)
 * @param {number} options.ttlMs - TTL in ms (default: 5 min)
 * @returns {Function} Memoized function
 */
export function createMemoizedFunction(fn, options = {}) {
    const cache = createCache(options);

    return function (...args) {
        // Simple key generation from arguments
        const key = JSON.stringify(args);

        const cachedValue = cache.get(key);

        if (cachedValue !== null) {
            return cachedValue;
        }

        const result = fn.apply(this, args);
        cache.set(key, result);

        return result;
    };
}
