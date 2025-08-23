import React from 'react';
import type { Task, TaskCategory } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, Briefcase, Home, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface CategoryColumnProps {
  category: TaskCategory;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskStatusToggle: (task: Task) => void;
  onAddTask: () => void;
}

const categoryConfig = {
  life_admin: {
    title: 'Life Admin',
    icon: Home,
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-900'
  },
  work: {
    title: 'Work Tasks',
    icon: Briefcase,
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100 text-green-900'
  },
  weekly_recurring: {
    title: 'Weekly Tasks',
    icon: Calendar,
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'bg-purple-100 text-purple-900'
  }
};

export const CategoryColumn: React.FC<CategoryColumnProps> = ({
  category,
  tasks,
  onTaskClick,
  onTaskStatusToggle,
  onAddTask
}) => {
  const config = categoryConfig[category];
  const Icon = config.icon;
  
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;

  return (
    <div className={clsx('rounded-lg border-2 h-full flex flex-col', config.color)}>
      <div className={clsx('p-4 rounded-t-md', config.headerColor)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <h2 className="font-semibold text-lg">{config.title}</h2>
          </div>
          <button
            onClick={onAddTask}
            className="p-1 hover:bg-white/50 rounded transition-colors"
            title="Add task"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm opacity-80">
          {completedCount}/{totalCount} completed
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No tasks yet</p>
            <button
              onClick={onAddTask}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Add your first task
            </button>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onStatusToggle={() => onTaskStatusToggle(task)}
            />
          ))
        )}
      </div>
    </div>
  );
};