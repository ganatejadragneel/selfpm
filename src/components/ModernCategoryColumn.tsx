import React from 'react';
import type { Task, TaskCategory } from '../types';
import { ModernTaskCard } from './ModernTaskCard';
import { Plus, Home, Briefcase, RotateCcw } from 'lucide-react';
import { theme, categoryConfigs } from '../styles/theme';

interface ModernCategoryColumnProps {
  category: TaskCategory;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskStatusToggle: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAddTask: () => void;
}

const categoryIcons = {
  life_admin: Home,
  work: Briefcase,
  weekly_recurring: RotateCcw,
};

export const ModernCategoryColumn: React.FC<ModernCategoryColumnProps> = ({
  category,
  tasks,
  onTaskClick,
  onTaskStatusToggle,
  onDeleteTask,
  onAddTask
}) => {
  const config = categoryConfigs[category];
  const Icon = categoryIcons[category];
  
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      border: `1px solid ${config.borderColor}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Top accent line */}
      <div style={{
        height: '3px',
        background: config.gradient,
        width: '100%'
      }} />
      
      {/* Header */}
      <div style={{
        padding: '24px 20px 16px 20px',
        background: config.bgGradient,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: config.gradient,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${config.accentColor}33`
            }}>
              <Icon className="w-6 h-6" style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#1f2937',
                margin: '0 0 4px 0'
              }}>
                {config.title}
              </h2>
              <div style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {completedCount}/{totalCount} completed
              </div>
            </div>
          </div>
          <button
            onClick={onAddTask}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              background: config.gradient,
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 15px ${config.accentColor}33`,
              transition: 'all 0.2s ease'
            }}
            title="Add task"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = `0 6px 25px ${config.accentColor}44`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${config.accentColor}33`;
            }}
          >
            <Plus className="w-5 h-5" style={{ color: 'white' }} />
          </button>
        </div>
        
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div
            style={{
              height: '100%',
              background: config.gradient,
              borderRadius: '10px',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              width: `${completionRate}%`,
              boxShadow: `0 2px 8px ${config.accentColor}44`
            }}
          />
        </div>
      </div>
      
      {/* Task List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '8px 20px 20px 20px',
        minHeight: '200px'
      }}>
        {tasks.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 0',
            color: '#6b7280'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              {config.emoji}
            </div>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
              No tasks yet
            </p>
            <button
              onClick={onAddTask}
              style={{
                background: 'none',
                border: `2px dashed ${config.borderColor}`,
                color: config.accentColor,
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = config.bgGradient;
                e.currentTarget.style.borderColor = config.accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.borderColor = config.borderColor;
              }}
            >
              Add your first task
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map(task => (
              <ModernTaskCard
                key={task.id}
                task={task}
                categoryConfig={config}
                onClick={() => onTaskClick(task)}
                onStatusToggle={() => onTaskStatusToggle(task)}
                onDelete={() => onDeleteTask(task)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};