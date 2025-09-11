/**
 * WeekView.refactored - Refactored week view component
 * Uses new store architecture and service layer
 */

import React, { memo } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Filter,
  LayoutGrid,
  List,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useWeekView } from '../hooks/useWeekView';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { useUIStore } from '../store/uiStore';
import { TaskCard } from './TaskCard.refactored';
import { LoadingOverlay, EmptyState } from './LoadingStates';
import { withErrorBoundary } from './hoc/withErrorBoundary';
import type { Task, TaskCategory } from '../types';

function WeekViewComponent() {
  const {
    tasks,
    tasksByCategory,
    loading,
    error,
    statistics,
    weekDisplay,
    weekDates,
    goToCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    rolloverTasks,
    shouldShowRollover,
    filterState,
    clearFilters,
    viewMode,
    changeViewMode,
    categoryColors
  } = useWeekView();
  
  const { moveToCategory, selectTask, selectedTaskIds } = useTaskOperations();
  const { openTaskModal, showToast, startDrag, endDrag } = useUIStore();
  
  const [draggedTask, setDraggedTask] = React.useState<Task | null>(null);
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    if (task) {
      setDraggedTask(task);
      startDrag(task.id);
    }
  };
  
  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active.data.current?.task) {
      setDraggedTask(null);
      endDrag();
      return;
    }
    
    const task = active.data.current.task as Task;
    const newCategory = over.id as TaskCategory;
    
    if (task.category !== newCategory) {
      try {
        await moveToCategory(task.id, newCategory);
        showToast('success', `Moved to ${newCategory.replace('_', ' ')}`);
      } catch (error) {
        showToast('error', 'Failed to move task');
      }
    }
    
    setDraggedTask(null);
    endDrag();
  };
  
  // Render header
  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Week navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {weekDisplay.weekLabel}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {weekDisplay.dateRange}
            </p>
          </div>
          
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {!weekDates.isCurrentWeek && (
            <button
              onClick={goToCurrentWeek}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Current Week
            </button>
          )}
        </div>
        
        {/* Actions and stats */}
        <div className="flex items-center gap-4">
          {/* Statistics */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {statistics.completed}/{statistics.total} Done
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {statistics.completionRate}%
              </span>
            </div>
            {statistics.blocked > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {statistics.blocked} Blocked
                </span>
              </div>
            )}
          </div>
          
          {/* Rollover button */}
          {shouldShowRollover && (
            <button
              onClick={rolloverTasks}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Rollover Tasks
            </button>
          )}
          
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => changeViewMode('board')}
              className={`p-1.5 rounded ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              } transition-all`}
              aria-label="Board view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => changeViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              } transition-all`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => changeViewMode('timeline')}
              className={`p-1.5 rounded ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              } transition-all`}
              aria-label="Timeline view"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
          
          {/* New task button */}
          <button
            onClick={() => openTaskModal(undefined, 'create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            New Task
          </button>
        </div>
      </div>
      
      {/* Filter bar */}
      {(filterState.category || filterState.status || filterState.searchTerm) && (
        <div className="mt-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
          
          {filterState.category && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm rounded-full">
              {filterState.category.replace('_', ' ')}
            </span>
          )}
          
          {filterState.status && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-full">
              {filterState.status.replace('_', ' ')}
            </span>
          )}
          
          {filterState.searchTerm && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm rounded-full">
              "{filterState.searchTerm}"
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="ml-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
  
  // Render board view
  const renderBoardView = () => (
    <div className="flex-1 overflow-x-auto">
      <div className="min-w-max p-6">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-6">
            {Array.from(tasksByCategory.entries()).map(([category, categoryTasks]) => (
              <CategoryColumn
                key={category}
                category={category}
                tasks={categoryTasks}
                color={categoryColors[category]}
                onTaskClick={(task) => openTaskModal(task.id, 'edit')}
                onTaskSelect={(task, selected) => selectTask(task.id, selected)}
                selectedTaskIds={selectedTaskIds}
              />
            ))}
          </div>
          
          <DragOverlay>
            {draggedTask && (
              <div className="opacity-80 rotate-2">
                <TaskCard task={draggedTask} isSelected={false} onSelect={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
  
  // Render list view
  const renderListView = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-2">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTaskIds.has(task.id)}
            onSelect={(selected: boolean) => selectTask(task.id, selected)}
          />
        ))}
      </div>
    </div>
  );
  
  // Render timeline view (placeholder)
  const renderTimelineView = () => (
    <div className="flex-1 flex items-center justify-center">
      <EmptyState
        icon={Clock}
        title="Timeline View"
        description="Timeline view is coming soon"
      />
    </div>
  );
  
  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Error loading tasks"
          description={error}
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }
  
  // Main render
  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      {renderHeader()}
      
      <LoadingOverlay visible={loading} message="Loading tasks..." />
      
      {!loading && tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Calendar}
            title="No tasks this week"
            description="Create your first task to get started"
            action={
              <button
                onClick={() => openTaskModal(undefined, 'create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Task
              </button>
            }
          />
        </div>
      ) : (
        <>
          {viewMode === 'board' && renderBoardView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'timeline' && renderTimelineView()}
        </>
      )}
    </div>
  );
}

// Helper component for category columns
interface CategoryColumnProps {
  category: TaskCategory;
  tasks: Task[];
  color?: string;
  onTaskClick: (task: Task) => void;
  onTaskSelect: (task: Task, selected: boolean) => void;
  selectedTaskIds: Set<string>;
}

function CategoryColumn({
  category,
  tasks,
  color = '#3B82F6',
  onTaskClick,
  onTaskSelect,
  selectedTaskIds
}: CategoryColumnProps) {
  const categoryLabels: Record<TaskCategory, string> = {
    life_admin: 'Life Admin',
    work: 'Work',
    weekly_recurring: 'Weekly Recurring'
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div 
        className="px-4 py-3 border-b border-gray-200 dark:border-gray-700"
        style={{ borderTopColor: color, borderTopWidth: '3px' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {categoryLabels[category]}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-3 min-h-[200px]">
        {tasks.map(task => (
          <div key={task.id} onClick={() => onTaskClick(task)}>
            <TaskCard
              task={task}
              isSelected={selectedTaskIds.has(task.id)}
              onSelect={(selected: boolean) => onTaskSelect(task, selected)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Export with error boundary
export const WeekView = withErrorBoundary(memo(WeekViewComponent));