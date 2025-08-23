import React from 'react';
import type { Task } from '../types';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { clsx } from 'clsx';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onStatusToggle: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusToggle }) => {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = () => {
    if (task.dueDate && isPast(new Date(task.dueDate))) return 'border-red-500 bg-red-50';
    if (task.dueDate && isToday(new Date(task.dueDate))) return 'border-orange-500 bg-orange-50';
    if (task.dueDate && isTomorrow(new Date(task.dueDate))) return 'border-yellow-500 bg-yellow-50';
    
    switch (task.priority) {
      case 'urgent':
        return 'border-red-400 bg-red-50';
      case 'high':
        return 'border-orange-400 bg-orange-50';
      case 'low':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      className={clsx(
        'p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
        getPriorityColor()
      )}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusToggle();
          }}
          className="mt-1"
        >
          {getStatusIcon()}
        </button>
        
        <div className="flex-1 min-w-0" onClick={onClick}>
          <h3 className={clsx(
            'font-medium text-gray-900',
            task.status === 'done' && 'line-through text-gray-500'
          )}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-xs">
            {task.dueDate && (
              <span className={clsx(
                'flex items-center gap-1',
                isPast(new Date(task.dueDate)) && task.status !== 'done' && 'text-red-600 font-semibold'
              )}>
                <Clock className="w-3 h-3" />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1 text-gray-600">
                ✓ {completedSubtasks}/{totalSubtasks}
              </span>
            )}
            
            {task.progressTotal && (
              <div className="flex items-center gap-1">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(task.progressCurrent || 0) / task.progressTotal * 100}%` }}
                  />
                </div>
                <span className="text-gray-600">
                  {task.progressCurrent}/{task.progressTotal}
                </span>
              </div>
            )}
            
            {task.isRecurring && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                Weekly
              </span>
            )}
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
      </div>
    </div>
  );
};