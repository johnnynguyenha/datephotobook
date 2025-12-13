const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type CacheEntry<T> = {
    data: T;
    timestamp: number;
    userId: string;
};

export function getCachedData<T>(key: string, userId: string | null): T | null {
    if (typeof window === "undefined" || !userId) return null;
    
    try {
        const cached = localStorage.getItem(`cache:${key}:${userId}`);
        if (!cached) return null;
        
        const entry: CacheEntry<T> = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is valid and matches current user
        if (entry.userId === userId && (now - entry.timestamp) < CACHE_TTL) {
            return entry.data;
        }
        
        // Cache expired or user changed, remove it
        localStorage.removeItem(`cache:${key}:${userId}`);
        return null;
    } catch {
        return null;
    }
}

export function setCachedData<T>(key: string, userId: string, data: T): void {
    if (typeof window === "undefined") return;
    
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            userId,
        };
        localStorage.setItem(`cache:${key}:${userId}`, JSON.stringify(entry));
    } catch {
        // Ignore storage errors
    }
}

export function clearCache(key?: string, userId?: string): void {
    if (typeof window === "undefined") return;
    
    try {
        if (key && userId) {
            localStorage.removeItem(`cache:${key}:${userId}`);
        } else if (key) {
            // Clear all entries for this key
            const keys = Object.keys(localStorage);
            keys.forEach(k => {
                if (k.startsWith(`cache:${key}:`)) {
                    localStorage.removeItem(k);
                }
            });
        } else {
            // Clear all cache entries
            const keys = Object.keys(localStorage);
            keys.forEach(k => {
                if (k.startsWith("cache:")) {
                    localStorage.removeItem(k);
                }
            });
        }
    } catch {
        // Ignore storage errors
    }
}

