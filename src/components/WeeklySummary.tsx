import React from 'react';
import type { Task } from '../types';
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface WeeklySummaryProps {
  tasks: Task[];
  weekNumber: number;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ tasks, weekNumber }) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    
    categories: {
      lifeAdmin: {
        total: tasks.filter(t => t.category === 'life_admin').length,
        completed: tasks.filter(t => t.category === 'life_admin' && t.status === 'done').length
      },
      work: {
        total: tasks.filter(t => t.category === 'work').length,
        completed: tasks.filter(t => t.category === 'work' && t.status === 'done').length
      },
      weeklyRecurring: {
        total: tasks.filter(t => t.category === 'weekly_recurring').length,
        completed: tasks.filter(t => t.category === 'weekly_recurring' && t.status === 'done').length
      }
    }
  };
  
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  
  // Calculate progress for tasks with measurable progress
  const progressTasks = tasks.filter(t => t.progressTotal);
  const totalProgress = progressTasks.reduce((acc, t) => acc + (t.progressCurrent || 0), 0);
  const totalGoal = progressTasks.reduce((acc, t) => acc + (t.progressTotal || 0), 0);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      padding: '32px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
        backgroundSize: '200% 100%',
        animation: 'gradient-flow 3s ease-in-out infinite'
      }}></div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px 0'
          }}>
            Week {weekNumber} Overview
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: '1',
            margin: 0
          }}>
            {completionRate}%
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Complete</div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '12px',
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            margin: '0 auto 12px auto',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'white' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669', margin: '0 0 4px 0' }}>
            {stats.completed}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Done</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '12px',
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '16px',
            margin: '0 auto 12px auto',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
          }}>
            <Clock className="w-8 h-8" style={{ color: 'white' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8', margin: '0 0 4px 0' }}>
            {stats.inProgress}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>In Progress</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '12px',
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '16px',
            margin: '0 auto 12px auto',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
          }}>
            <AlertCircle className="w-8 h-8" style={{ color: 'white' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 4px 0' }}>
            {stats.blocked}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Blocked</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '12px',
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '16px',
            margin: '0 auto 12px auto',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
          }}>
            <TrendingUp className="w-8 h-8" style={{ color: 'white' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed', margin: '0 0 4px 0' }}>
            {stats.todo}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>To Do</div>
        </div>
      </div>
      
      {totalGoal > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Overall Progress</span>
            <span style={{ fontWeight: '700', color: '#374151' }}>{totalProgress} / {totalGoal}</span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(229, 231, 235, 0.8)',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '10px',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                width: `${(totalProgress / totalGoal) * 100}%`,
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
              }}
            />
          </div>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
            🏠 Life Admin
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }}>
            {stats.categories.lifeAdmin.completed}/{stats.categories.lifeAdmin.total}
          </div>
        </div>
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
            💼 Work Tasks
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
            {stats.categories.work.completed}/{stats.categories.work.total}
          </div>
        </div>
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
            🔄 Weekly
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
            {stats.categories.weeklyRecurring.completed}/{stats.categories.weeklyRecurring.total}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes gradient-flow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>
    </div>
  );
};