let isDebugEnabled = false;
let isPerformanceEnabled = false;

// Store timing data for performance tracking
const performanceMetrics: Record<
  string,
  { count: number; totalTime: number; max: number; min: number }
> = {};

export const debug = {
  enable: () => {
    isDebugEnabled = true;
  },
  enablePerformance: () => {
    isPerformanceEnabled = true;
  },
  disable: () => {
    isDebugEnabled = false;
  },
  disablePerformance: () => {
    isPerformanceEnabled = false;
  },
  log: (...args: any[]) => {
    if (isDebugEnabled) {
      console.log("[BNS-V2-SDK]:", ...args);
    }
  },
  error: (...args: any[]) => {
    if (isDebugEnabled) {
      console.error("[BNS-V2-SDK]:", ...args);
    }
  },
  startTimer: (label: string): (() => void) => {
    if (!isPerformanceEnabled) return () => {};

    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (!performanceMetrics[label]) {
        performanceMetrics[label] = {
          count: 0,
          totalTime: 0,
          max: duration,
          min: duration,
        };
      }

      const metrics = performanceMetrics[label];
      metrics.count++;
      metrics.totalTime += duration;
      metrics.max = Math.max(metrics.max, duration);
      metrics.min = Math.min(metrics.min, duration);

      if (isDebugEnabled) {
        console.log(
          `[BNS-V2-SDK Performance] ${label}: ${duration.toFixed(2)}ms`
        );
      }
    };
  },
  getPerformanceMetrics: () => {
    return Object.entries(performanceMetrics).map(([label, metrics]) => ({
      label,
      count: metrics.count,
      totalTime: metrics.totalTime,
      avgTime: metrics.totalTime / metrics.count,
      maxTime: metrics.max,
      minTime: metrics.min,
    }));
  },
};
