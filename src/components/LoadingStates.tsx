/**
 * LoadingStates - Reusable loading components
 * Provides consistent loading UI across the application
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

// Spinner loader
export function Spinner({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      aria-label="Loading"
    />
  );
}

// Full page loader
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// Skeleton loader for cards
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
      </div>
    </div>
  );
}

// Skeleton loader for list items
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

// Table skeleton loader
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-3 text-left">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b dark:border-gray-700">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="p-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Text skeleton loader
export function TextSkeleton({ 
  lines = 3,
  className = '' 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: `${100 - (i * 15)}%` }}
        ></div>
      ))}
    </div>
  );
}

// Progress loader
export function ProgressLoader({ 
  progress,
  message 
}: { 
  progress: number;
  message?: string;
}) {
  return (
    <div className="w-full max-w-md">
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{message}</p>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
        {Math.round(progress)}%
      </p>
    </div>
  );
}

// Dots loader
export function DotsLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`}>
      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
    </div>
  );
}

// Inline loader for buttons
export function ButtonLoader({ text = 'Loading' }: { text?: string }) {
  return (
    <span className="flex items-center gap-2">
      <Spinner size="sm" />
      <span>{text}</span>
    </span>
  );
}

// Empty state component
export function EmptyState({ 
  icon: Icon,
  title,
  description,
  action
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// Loading overlay for existing content
export function LoadingOverlay({ 
  visible,
  message 
}: { 
  visible: boolean;
  message?: string;
}) {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" className="text-blue-600 dark:text-blue-400" />
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}

// Suspense fallback component
export function SuspenseFallback({ 
  type = 'card' 
}: { 
  type?: 'card' | 'list' | 'table' | 'page';
}) {
  switch (type) {
    case 'list':
      return <ListSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'page':
      return <PageLoader />;
    case 'card':
    default:
      return <CardSkeleton />;
  }
}