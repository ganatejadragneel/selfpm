import React from 'react';
import type { TaskCategory, TaskPriority } from '../types';
import { useMigratedTaskStore } from '../store/migratedTaskStore';
import { SpeechToTextButton } from './SpeechToTextButton';
import { priorityConfigs } from '../styles/theme';
import { useFormOptions } from '../hooks/useConfigurations';
import { useFormState } from '../hooks/useFormState';
import { addTaskSchema } from '../utils/formSchemas';
import type { AddTaskFormData } from '../utils/formSchemas';
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

  // Use schema with dynamic initial category
  const schemaWithCategory = {
    ...addTaskSchema,
    category: { ...addTaskSchema.category, initialValue: initialCategory }
  };

  const form = useFormState<AddTaskFormData>(schemaWithCategory);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.validateForm()) return;

    const { values } = form;

    try {
      await createTask({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        category: values.category,
        dueDate: values.dueDate || undefined,
        progressTotal: values.progressTotal ? parseInt(values.progressTotal) : undefined,
        priority: values.priority,
        recurrenceWeeks: values.category === 'weekly_recurring' ? values.recurrenceWeeks : undefined,
        estimatedDuration: values.estimatedDuration
      });

      // Reset form
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-[20px] shadow-modal w-full max-w-[500px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-brand-500/5 border-b border-brand-500/10">
          <div className="flex items-center justify-between">
            <h2 className="text-brand-gradient text-2xl font-bold m-0">
              Add New Task
            </h2>

            <button
              onClick={onClose}
              className="w-10 h-10 border-none bg-brand-500/10 rounded-control cursor-pointer text-xl text-brand-500 flex items-center justify-center transition-all"
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

        <div className="p-8 overflow-auto box-border" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Category Selection */}
          <ButtonGroup
            label="Category"
            value={form.values.category}
            onChange={(value) => form.setValue('category', value as TaskCategory)}
            options={categoryOptions}
            columns={3}
          />

          {/* Task Title */}
          <div className="mb-5">
            <Input
              label="Task Title *"
              value={form.values.title}
              onChange={form.handleChange('title')}
              placeholder="What needs to be done?"
              required
              rightIcon={<SpeechToTextButton onTranscription={(text) => form.setValue('title', text)} size="sm" />}
            />
          </div>

          {/* Description */}
          <div className="mb-5 relative">
            <Textarea
              label="Description"
              value={form.values.description}
              onChange={form.handleChange('description')}
              placeholder="Add more details..."
              rows={3}
            />
            <div className="absolute right-2 top-8">
              <SpeechToTextButton
                onTranscription={(text) => form.setValue('description', form.values.description ? `${form.values.description} ${text}` : text)}
                size="sm"
              />
            </div>
          </div>

          {/* Priority Selection */}
          <ButtonGroup
            label="Priority"
            value={form.values.priority}
            onChange={(value) => form.setValue('priority', value as TaskPriority)}
            options={(Object.keys(priorityConfigs) as TaskPriority[]).map(prio => ({
              value: prio,
              label: `${priorityConfigs[prio].icon} ${priorityConfigs[prio].title}`,
              color: priorityConfigs[prio].bgColor
            }))}
            columns={2}
          />

          {/* Due Date and Progress Goal */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Input
              label="Due Date"
              type="date"
              value={form.values.dueDate}
              onChange={form.handleChange('dueDate')}
            />
            <NumberField
              label="Progress Goal"
              value={form.values.progressTotal ? parseInt(form.values.progressTotal) : undefined}
              onChange={(value) => form.setValue('progressTotal', value ? String(value) : '')}
              placeholder="e.g. 50"
              min={1}
            />
          </div>

          {/* Estimated Duration */}
          <SelectField
            label="Estimated Duration"
            value={String(form.values.estimatedDuration || 5)}
            onChange={(value) => form.setValue('estimatedDuration', value ? parseInt(value) : undefined)}
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
          {form.values.category === 'weekly_recurring' && (
            <SelectField
              label="Number of Weeks *"
              value={String(form.values.recurrenceWeeks)}
              onChange={(value) => form.setValue('recurrenceWeeks', parseInt(value))}
              options={Array.from({ length: 15 }, (_, i) => i + 1).map(num => ({
                value: String(num),
                label: `${num} ${num === 1 ? 'week' : 'weeks'}`
              }))}
              helperText={`This task will appear for ${form.values.recurrenceWeeks} consecutive week(s)`}
              required
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!form.isValid || !form.values.title.trim()}
              className="flex-1 py-3.5 px-6 text-white border-none rounded-control text-sm font-semibold transition-all"
              style={{
                backgroundImage: !form.values.title.trim() ? 'none' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundColor: !form.values.title.trim() ? 'var(--color-line)' : 'transparent',
                cursor: !form.values.title.trim() ? 'not-allowed' : 'pointer',
                boxShadow: !form.values.title.trim() ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (form.values.title.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (form.values.title.trim()) {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              Create Task
            </button>
            <button
              onClick={onClose}
              className="py-3.5 px-6 border-2 border-line text-ink-soft bg-surface rounded-control cursor-pointer text-sm font-medium transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-subtle)';
                e.currentTarget.style.borderColor = 'var(--color-line-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                e.currentTarget.style.borderColor = 'var(--color-line)';
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