/**
 * TaskCard.refactored - Refactored task card component
 * Uses new store architecture and service layer
 */

import React, { memo, useCallback, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  Copy,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskStatus } from '../types';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { useUIStore } from '../store/uiStore';

interface TaskCardProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: AlertCircle
};

const statusColors = {
  todo: 'text-gray-400',
  in_progress: 'text-blue-500',
  done: 'text-green-500',
  blocked: 'text-red-500'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
};

function TaskCardComponent({ task, isSelected = false, onSelect }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const { updateStatus, updateTask, deleteTask } = useTaskOperations();
  const { openTaskModal, showToast } = useUIStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  } : undefined;
  
  // Handle status toggle
  const handleStatusToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      todo: 'in_progress',
      in_progress: 'done',
      done: 'todo',
      blocked: 'todo'
    };
    
    await updateStatus(task.id, nextStatus[task.status]);
  }, [task.id, task.status, updateStatus]);
  
  // Handle task actions
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openTaskModal(task.id, 'edit');
    setShowMenu(false);
  }, [task.id, openTaskModal]);
  
  const handleDuplicate = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // const duplicatedTask = {
      //   ...task,
      //   title: `${task.title} (Copy)`,
      //   id: undefined
      // };
      
      // Create the duplicated task
      // This would need to be implemented in useTaskOperations
      showToast('info', 'Duplicate feature coming soon');
    } catch (error) {
      showToast('error', 'Failed to duplicate task');
    }
    
    setShowMenu(false);
  }, [task, showToast]);
  
  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
    
    setShowMenu(false);
  }, [task.id, deleteTask]);
  
  // Calculate progress percentage
  const progressPercentage = task.progressTotal 
    ? Math.round((task.progressCurrent || 0) / task.progressTotal * 100)
    : 0;
  
  const StatusIcon = statusIcons[task.status];
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border
        ${isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
          : 'border-gray-200 dark:border-gray-700'
        }
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'rotate-2' : ''}
      `}
      onClick={() => onSelect?.(!isSelected)}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1">
            <button
              onClick={handleStatusToggle}
              className={`mt-0.5 transition-colors ${statusColors[task.status]} hover:opacity-80`}
              aria-label={`Mark as ${task.status === 'done' ? 'todo' : 'done'}`}
            >
              <StatusIcon className="w-5 h-5" />
            </button>
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-gray-900 dark:text-white ${
                task.status === 'done' ? 'line-through opacity-60' : ''
              }`}>
                {task.title}
              </h3>
              
              {task.description && !isExpanded && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              {...listeners}
              {...attributes}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM7 18a2 2 0 11-4 0 2 2 0 014 0zM17 2a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM17 18a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Task options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded content */}
        {isExpanded && task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 pl-7">
            {task.description}
          </p>
        )}
        
        {/* Progress bar */}
        {task.progressTotal && (
          <div className="mb-3 pl-7">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 pl-7 mb-2"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>{task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} subtasks</span>
          </button>
        )}
        
        {isExpanded && task.subtasks && (
          <div className="pl-7 space-y-1 mb-3">
            {task.subtasks.map(subtask => (
              <div key={subtask.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subtask.isCompleted}
                  onChange={async (e) => {
                    e.stopPropagation();
                    // Update subtask completion
                    const updatedSubtasks = task.subtasks?.map(st =>
                      st.id === subtask.id ? { ...st, isCompleted: !st.isCompleted } : st
                    );
                    await updateTask(task.id, { subtasks: updatedSubtasks });
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className={`text-sm ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pl-7">
          <div className="flex items-center gap-3">
            {/* Priority badge */}
            {task.priority && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
            )}
            
            {/* Due date */}
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(task.dueDate), 'MMM d')}</span>
              </div>
            )}
            
            {/* Time tracking */}
            {task.estimatedDuration && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{task.timeSpent || 0}/{task.estimatedDuration}m</span>
              </div>
            )}
          </div>
          
          {/* Recurring indicator */}
          {task.isRecurring && (
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Recurring
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Apply HOCs for enhanced functionality
export const TaskCard = memo(TaskCardComponent);