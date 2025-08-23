import React, { useState } from 'react';
import type { TaskCategory } from '../types';
import { useTaskStore } from '../store/taskStore';
import { theme, categoryConfigs, styleUtils } from '../styles/theme';

interface AddTaskModalProps {
  isOpen: boolean;
  initialCategory: TaskCategory;
  onClose: () => void;
}

const categoryDisplayConfig = {
  life_admin: { label: 'Life Admin', color: theme.colors.status.info.light },
  work: { label: 'Work Tasks', color: theme.colors.status.success.light },
  weekly_recurring: { label: 'Weekly Tasks', color: theme.colors.status.purple.light }
};

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, initialCategory, onClose }) => {
  const { createTask } = useTaskStore();
  const [category, setCategory] = useState<TaskCategory>(initialCategory);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [progressTotal, setProgressTotal] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        dueDate: dueDate || undefined,
        progressTotal: progressTotal ? parseInt(progressTotal) : undefined,
        isRecurring,
        priority: 'medium'
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setProgressTotal('');
      setIsRecurring(false);
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '32px 32px 24px 32px', 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderBottom: '1px solid rgba(102, 126, 234, 0.1)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0 
            }}>
              Add New Task
            </h2>
            
            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                border: 'none',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: '32px', overflow: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
          {/* Category Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {(Object.keys(categoryDisplayConfig) as TaskCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: category === cat ? '2px solid #667eea' : '2px solid #e5e7eb',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: category === cat ? categoryDisplayConfig[cat].color : 'white',
                    color: '#374151',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (category !== cat) {
                      e.currentTarget.style.borderColor = '#9ca3af';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (category !== cat) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {categoryDisplayConfig[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Task Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              style={{
                width: '100%',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: 'white'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              style={{
                width: '100%',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: 'white'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Due Date and Progress Goal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Progress Goal
              </label>
              <input
                type="number"
                value={progressTotal}
                onChange={(e) => setProgressTotal(e.target.value)}
                placeholder="e.g. 50"
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Recurring Toggle */}
          {category === 'weekly_recurring' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  accentColor: '#667eea',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="recurring" style={{ fontSize: '14px', color: '#374151', fontWeight: '500', cursor: 'pointer' }}>
                This task repeats weekly
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              style={{
                flex: 1,
                padding: '14px 24px',
                backgroundColor: !title.trim() ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                background: !title.trim() ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: !title.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: !title.trim() ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (title.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (title.trim()) {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              Create Task
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '14px 24px',
                border: '2px solid #e5e7eb',
                color: '#6b7280',
                backgroundColor: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};