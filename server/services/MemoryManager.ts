/**
 * Memory Management Service
 *
 * Provides memory monitoring, leak detection, and garbage collection hints
 * to help maintain optimal application performance.
 */

import { EventEmitter } from 'events';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  externalMB: number;
  timestamp: number;
}

interface MemoryThresholds {
  warningMB: number;
  criticalMB: number;
  maxHeapPercentage: number;
}

interface CacheStats {
  name: string;
  size: number;
  maxSize: number;
  hitRate: number;
}

class MemoryManager extends EventEmitter {
  private readonly thresholds: MemoryThresholds;
  private readonly memoryHistory: MemoryStats[] = [];
  private readonly maxHistoryLength = 100;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private caches: Map<string, WeakRef<Map<any, any> | Set<any>>> = new Map();

  constructor(thresholds?: Partial<MemoryThresholds>) {
    super();
    this.thresholds = {
      warningMB: thresholds?.warningMB ?? 500,
      criticalMB: thresholds?.criticalMB ?? 800,
      maxHeapPercentage: thresholds?.maxHeapPercentage ?? 85,
    };
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      externalMB: Math.round(memUsage.external / 1024 / 1024),
      timestamp: Date.now(),
    };
  }

  /**
   * Start continuous memory monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMemory();
    }, intervalMs);

    // Check immediately on start
    this.checkMemory();

    console.log(`[MemoryManager] Started monitoring every ${intervalMs / 1000}s`);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[MemoryManager] Stopped monitoring');
    }
  }

  /**
   * Check current memory and emit events if thresholds exceeded
   */
  private checkMemory(): void {
    const stats = this.getMemoryStats();
    this.memoryHistory.push(stats);

    // Keep history limited
    if (this.memoryHistory.length > this.maxHistoryLength) {
      this.memoryHistory.shift();
    }

    // Check thresholds
    const heapPercentage = (stats.heapUsed / stats.heapTotal) * 100;

    if (stats.heapUsedMB >= this.thresholds.criticalMB) {
      this.emit('critical', {
        message: `Critical memory usage: ${stats.heapUsedMB}MB`,
        stats,
      });
      this.triggerGC();
    } else if (stats.heapUsedMB >= this.thresholds.warningMB) {
      this.emit('warning', {
        message: `High memory usage: ${stats.heapUsedMB}MB`,
        stats,
      });
    }

    if (heapPercentage >= this.thresholds.maxHeapPercentage) {
      this.emit('heap-pressure', {
        message: `Heap at ${heapPercentage.toFixed(1)}% capacity`,
        stats,
      });
      this.triggerGC();
    }
  }

  /**
   * Manually trigger garbage collection if exposed
   */
  triggerGC(): boolean {
    if (global.gc) {
      try {
        global.gc();
        console.log('[MemoryManager] Garbage collection triggered');
        return true;
      } catch (e) {
        console.error('[MemoryManager] GC failed:', e);
        return false;
      }
    }
    return false;
  }

  /**
   * Register a cache for tracking
   */
  registerCache(name: string, cache: Map<any, any> | Set<any>): void {
    this.caches.set(name, new WeakRef(cache));
  }

  /**
   * Get all registered cache statistics
   */
  getCacheStats(): CacheStats[] {
    const stats: CacheStats[] = [];

    for (const [name, ref] of this.caches.entries()) {
      const cache = ref.deref();
      if (cache) {
        stats.push({
          name,
          size: cache.size,
          maxSize: 0, // Would need to track this separately
          hitRate: 0, // Would need hit/miss tracking
        });
      } else {
        // Cache was garbage collected, remove reference
        this.caches.delete(name);
      }
    }

    return stats;
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend(): {
    current: MemoryStats;
    average: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    history: MemoryStats[];
  } {
    const current = this.getMemoryStats();

    if (this.memoryHistory.length < 2) {
      return {
        current,
        average: current.heapUsedMB,
        trend: 'stable',
        history: this.memoryHistory,
      };
    }

    const recentHistory = this.memoryHistory.slice(-10);
    const average = recentHistory.reduce((sum, s) => sum + s.heapUsedMB, 0) / recentHistory.length;

    // Calculate trend
    const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2));
    const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.heapUsedMB, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.heapUsedMB, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    let trend: 'increasing' | 'stable' | 'decreasing';

    if (diff > 5) {
      trend = 'increasing';
    } else if (diff < -5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      current,
      average: Math.round(average),
      trend,
      history: this.memoryHistory,
    };
  }

  /**
   * Create a size-limited LRU cache
   */
  createLRUCache<K, V>(maxSize: number, name?: string): LRUCache<K, V> {
    const cache = new LRUCache<K, V>(maxSize);
    if (name) {
      this.registerCache(name, cache.getMap());
    }
    return cache;
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    memory: MemoryStats;
    trend: string;
    caches: CacheStats[];
  } {
    const memoryTrend = this.getMemoryTrend();
    const cacheStats = this.getCacheStats();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (memoryTrend.current.heapUsedMB >= this.thresholds.criticalMB) {
      status = 'critical';
    } else if (memoryTrend.current.heapUsedMB >= this.thresholds.warningMB) {
      status = 'warning';
    } else if (memoryTrend.trend === 'increasing' && memoryTrend.current.heapUsedMB > this.thresholds.warningMB * 0.8) {
      status = 'warning';
    }

    return {
      status,
      memory: memoryTrend.current,
      trend: memoryTrend.trend,
      caches: cacheStats,
    };
  }
}

/**
 * Simple LRU Cache implementation
 */
class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly cache: Map<K, V> = new Map();

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  getMap(): Map<K, V> {
    return this.cache;
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager();

// Export classes for custom usage
export { MemoryManager, LRUCache };
export type { MemoryStats, MemoryThresholds, CacheStats };
