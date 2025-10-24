import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, Clock, Database, TrendingUp } from 'lucide-react';

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  avgResponseTime: number;
  lastUpdate: Date;
}

export function CachePerformanceMonitor() {
  const [stats, setStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    totalRequests: 0,
    avgResponseTime: 0,
    lastUpdate: new Date()
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for cache events from the database service
    const handleCacheHit = () => {
      setStats(prev => ({
        ...prev,
        hits: prev.hits + 1,
        totalRequests: prev.totalRequests + 1,
        lastUpdate: new Date()
      }));
    };

    const handleCacheMiss = () => {
      setStats(prev => ({
        ...prev,
        misses: prev.misses + 1,
        totalRequests: prev.totalRequests + 1,
        lastUpdate: new Date()
      }));
    };

    // Add event listeners
    window.addEventListener('cache-hit', handleCacheHit);
    window.addEventListener('cache-miss', handleCacheMiss);

    // Show monitor in development only
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('cache-hit', handleCacheHit);
      window.removeEventListener('cache-miss', handleCacheMiss);
    };
  }, []);

  const hitRate = stats.totalRequests > 0 
    ? Math.round((stats.hits / stats.totalRequests) * 100) 
    : 0;

  // Only render in development mode
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 shadow-lg bg-white/95 backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-sm">Cache Performance Monitor</span>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {/* Hit Rate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs text-gray-600">Hit Rate</span>
            </div>
            <Badge 
              variant={hitRate >= 70 ? "default" : hitRate >= 50 ? "secondary" : "destructive"}
            >
              {hitRate}%
            </Badge>
          </div>

          {/* Total Requests */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-gray-600">Total Requests</span>
            </div>
            <span className="text-xs font-mono">{stats.totalRequests}</span>
          </div>

          {/* Cache Hits */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 ml-5">Cache Hits</span>
            <span className="text-xs font-mono text-green-600">{stats.hits}</span>
          </div>

          {/* Cache Misses */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 ml-5">Cache Misses</span>
            <span className="text-xs font-mono text-orange-600">{stats.misses}</span>
          </div>

          {/* Last Update */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">Last Update</span>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {stats.lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          {/* Performance Indicator */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  hitRate >= 70 
                    ? 'bg-green-500' 
                    : hitRate >= 50 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-600">
                {hitRate >= 70 
                  ? 'Excellent Performance' 
                  : hitRate >= 50 
                  ? 'Good Performance' 
                  : 'Consider Optimization'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <button
            onClick={() => {
              setStats({
                hits: 0,
                misses: 0,
                totalRequests: 0,
                avgResponseTime: 0,
                lastUpdate: new Date()
              });
            }}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Reset Stats
          </button>
        </div>
      </Card>
    </div>
  );
}

// Helper function to dispatch cache events (add to database service)
export function dispatchCacheEvent(type: 'hit' | 'miss') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`cache-${type}`));
  }
}
