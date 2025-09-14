import React, { useState } from 'react';
import type { TaskCategory, TaskPriority } from '../types';
import { useMigratedTaskStore } from '../store/migratedTaskStore';
import { SpeechToTextButton } from './SpeechToTextButton';
import { priorityConfigs } from '../styles/theme';
import { useFormOptions } from '../hooks/useConfigurations';
import { Input, Textarea } from './ui/Input';
import { ButtonGroup, SelectField, NumberField } from './forms';

interface AddTaskModalProps {
  isOpen: boolean;
  initialCategory: TaskCategory;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, initialCategory, onClose }) => {
  const { createTask } = useMigratedTaskStore();
  const { categoryOptions } = useFormOptions();
  const [category, setCategory] = useState<TaskCategory>(initialCategory);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [progressTotal, setProgressTotal] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>(5); // Default to 5 minutes

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
        priority,
        recurrenceWeeks: category === 'weekly_recurring' ? recurrenceWeeks : undefined,
        estimatedDuration
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setProgressTotal('');
      setPriority('medium');
      setRecurrenceWeeks(1);
      setEstimatedDuration(5); // Reset to default 5 minutes
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

        <div style={{ 
          padding: '32px', 
          overflow: 'auto', 
          maxHeight: 'calc(90vh - 140px)',
          boxSizing: 'border-box'
        }}>
          {/* Category Selection */}
          <ButtonGroup
            label="Category"
            value={category}
            onChange={(value) => setCategory(value as TaskCategory)}
            options={categoryOptions}
            columns={3}
          />

          {/* Task Title */}
          <div style={{ marginBottom: '20px' }}>
            <Input
              label="Task Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              rightIcon={<SpeechToTextButton onTranscription={setTitle} size="sm" />}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '32px'
            }}>
              <SpeechToTextButton
                onTranscription={(text) => setDescription(prev => prev ? `${prev} ${text}` : text)}
                size="sm"
              />
            </div>
          </div>

          {/* Priority Selection */}
          <ButtonGroup
            label="Priority"
            value={priority}
            onChange={(value) => setPriority(value as TaskPriority)}
            options={(Object.keys(priorityConfigs) as TaskPriority[]).map(prio => ({
              value: prio,
              label: `${priorityConfigs[prio].icon} ${priorityConfigs[prio].title}`,
              color: priorityConfigs[prio].bgColor
            }))}
            columns={2}
          />

          {/* Due Date and Progress Goal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <NumberField
              label="Progress Goal"
              value={progressTotal ? parseInt(progressTotal) : undefined}
              onChange={(value) => setProgressTotal(value ? String(value) : '')}
              placeholder="e.g. 50"
              min={1}
            />
          </div>

          {/* Estimated Duration */}
          <SelectField
            label="Estimated Duration"
            value={String(estimatedDuration || 5)}
            onChange={(value) => setEstimatedDuration(value ? parseInt(value) : undefined)}
            options={[
              { value: '5', label: '5 min' },
              { value: '10', label: '10 min' },
              { value: '15', label: '15 min' },
              { value: '20', label: '20 min' },
              { value: '30', label: '30 min' },
              { value: '45', label: '45 min' },
              { value: '60', label: '1 hour' },
              { value: '90', label: '1.5 hours' },
              { value: '120', label: '2 hours' },
              { value: '180', label: '3 hours' },
              { value: '240', label: '4 hours' },
              { value: '300', label: '5 hours' },
              { value: '360', label: '6 hours' },
              { value: '480', label: '8 hours' },
              { value: '600', label: '10 hours' },
              { value: '720', label: '12 hours' },
              { value: '960', label: '16 hours' },
              { value: '1200', label: '20 hours' },
              { value: '1440', label: '24 hours' }
            ]}
          />

          {/* Number of Weeks for Weekly Tasks */}
          {category === 'weekly_recurring' && (
            <SelectField
              label="Number of Weeks *"
              value={String(recurrenceWeeks)}
              onChange={(value) => setRecurrenceWeeks(parseInt(value))}
              options={Array.from({ length: 15 }, (_, i) => i + 1).map(num => ({
                value: String(num),
                label: `${num} ${num === 1 ? 'week' : 'weeks'}`
              }))}
              helperText={`This task will appear for ${recurrenceWeeks} consecutive week(s)`}
              required
            />
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