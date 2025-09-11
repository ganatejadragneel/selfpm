/**
 * withPerformance HOC - Performance monitoring wrapper
 * Tracks component render times and re-renders
 */

import React, { useEffect, useRef, Profiler } from 'react';
import type { ComponentType } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  lastRenderDuration: number;
  averageRenderDuration: number;
  totalRenderTime: number;
}

const performanceStore = new Map<string, PerformanceMetrics>();

export function withPerformance<P extends object>(
  Component: ComponentType<P>,
  options: {
    trackProps?: (keyof P)[];
    logThreshold?: number; // Log if render takes longer than this (ms)
    enableProfiling?: boolean;
  } = {}
) {
  const {
    trackProps = [],
    logThreshold = 16, // 60fps = ~16ms per frame
    enableProfiling = process.env.NODE_ENV === 'development'
  } = options;
  
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props: P) => {
    const renderCount = useRef(0);
    const renderTimes = useRef<number[]>([]);
    const prevProps = useRef<P>(props);
    
    useEffect(() => {
      renderCount.current++;
      
      // Track prop changes
      if (trackProps.length > 0) {
        const changedProps = trackProps.filter(
          prop => prevProps.current[prop] !== props[prop]
        );
        
        if (changedProps.length > 0) {
          console.debug(`[Performance] ${displayName} re-rendered due to props:`, changedProps);
        }
      }
      
      prevProps.current = props;
    });
    
    const onRenderCallback = (
      id: string,
      phase: 'mount' | 'update' | 'nested-update',
      actualDuration: number,
      _baseDuration: number,
      _startTime: number,
      _commitTime: number
    ) => {
      renderTimes.current.push(actualDuration);
      
      const metrics: PerformanceMetrics = {
        componentName: id,
        renderCount: renderCount.current,
        lastRenderDuration: actualDuration,
        averageRenderDuration: 
          renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length,
        totalRenderTime: renderTimes.current.reduce((a, b) => a + b, 0)
      };
      
      performanceStore.set(id, metrics);
      
      // Log slow renders
      if (actualDuration > logThreshold) {
        console.warn(
          `[Performance] Slow render detected in ${id}:`,
          {
            phase,
            duration: `${actualDuration.toFixed(2)}ms`,
            threshold: `${logThreshold}ms`,
            renderCount: renderCount.current
          }
        );
      }
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development' && renderCount.current % 10 === 0) {
        console.debug(`[Performance] ${id} metrics:`, metrics);
      }
    };
    
    if (!enableProfiling) {
      return React.createElement(Component, props);
    }
    
    return React.createElement(
      Profiler,
      { id: displayName, onRender: onRenderCallback },
      React.createElement(Component, props)
    );
  };
  
  WrappedComponent.displayName = `withPerformance(${displayName})`;
  
  return WrappedComponent;
}

// Utility to get performance metrics
export function getPerformanceMetrics(componentName?: string): PerformanceMetrics[] {
  if (componentName) {
    const metrics = performanceStore.get(componentName);
    return metrics ? [metrics] : [];
  }
  
  return Array.from(performanceStore.values());
}

// Utility to clear performance metrics
export function clearPerformanceMetrics(componentName?: string): void {
  if (componentName) {
    performanceStore.delete(componentName);
  } else {
    performanceStore.clear();
  }
}