import React, { useState } from 'react';
import type { TaskCategory } from '../types';
import { useTaskStore } from '../store/taskStore';
import { parseTaskText, parseStructuredText } from '../utils/taskParser';

interface SimpleQuickAddModalProps {
  isOpen: boolean;
  initialCategory: TaskCategory;
  onClose: () => void;
}

const categoryConfig = {
  life_admin: { label: 'Life Admin', color: '#dbeafe' },
  work: { label: 'Work Tasks', color: '#dcfce7' },
  weekly_recurring: { label: 'Weekly Tasks', color: '#f3e8ff' }
};

export const SimpleQuickAddModal: React.FC<SimpleQuickAddModalProps> = ({ isOpen, initialCategory, onClose }) => {
  const { createTask } = useTaskStore();
  const [category, setCategory] = useState<TaskCategory>(initialCategory);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  // Single task mode
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [progressTotal, setProgressTotal] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  
  // Bulk mode
  const [bulkText, setBulkText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleSingleSubmit = async () => {
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

  const handleBulkParse = () => {
    if (!bulkText.trim()) return;
    
    setParsing(true);
    try {
      let parsed = parseStructuredText(bulkText);
      
      if (parsed.length === 0) {
        parsed = parseTaskText(bulkText);
      }
      
      const tasksWithCategory = parsed.map(task => ({
        ...task,
        category: task.category || category
      }));
      
      setParsedTasks(tasksWithCategory);
    } catch (error) {
      console.error('Error parsing tasks:', error);
    } finally {
      setParsing(false);
    }
  };

  const handleBulkSubmit = async () => {
    try {
      for (const taskData of parsedTasks) {
        await createTask({
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          dueDate: taskData.dueDate,
          progressTotal: taskData.progressTotal,
          isRecurring: taskData.category === 'weekly_recurring',
          priority: 'medium'
        });
      }
      
      setBulkText('');
      setParsedTasks([]);
      onClose();
    } catch (error) {
      console.error('Error creating bulk tasks:', error);
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
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111', margin: 0 }}>Add Tasks</h2>
            
            <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
              <button
                onClick={() => setMode('single')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: mode === 'single' ? 'white' : 'transparent',
                  color: mode === 'single' ? '#111' : '#6b7280',
                  boxShadow: mode === 'single' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                }}
              >
                Quick Add
              </button>
              <button
                onClick={() => setMode('bulk')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: mode === 'bulk' ? 'white' : 'transparent',
                  color: mode === 'bulk' ? '#111' : '#6b7280',
                  boxShadow: mode === 'bulk' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                }}
              >
                Bulk Add
              </button>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px', overflow: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
          {/* Category Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(Object.keys(categoryConfig) as TaskCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: category === cat ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: category === cat ? categoryConfig[cat].color : 'white',
                    color: '#374151'
                  }}
                >
                  {categoryConfig[cat].label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'single' ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Due Date (optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Progress Goal (optional)
                  </label>
                  <input
                    type="number"
                    value={progressTotal}
                    onChange={(e) => setProgressTotal(e.target.value)}
                    placeholder="e.g. 50 for 50 pages"
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {category === 'weekly_recurring' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="recurring" style={{ fontSize: '14px', color: '#374151' }}>
                    This task repeats weekly
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button
                  onClick={handleSingleSubmit}
                  disabled={!title.trim()}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    backgroundColor: !title.trim() ? '#d1d5db' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: !title.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Add Task
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Paste your task list
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Paste your task list here. For example:

1. Review blood test results and identify next steps
2. Complete 50 user stories for work project
3. Read 80 pages of Team of Teams book
4. Order birthday gift for friend next week

The system will automatically detect:
- Task numbers and subtasks
- Progress goals (numbers like '50 stories', '80 pages')  
- Due dates ('next week', 'Friday', etc.)
- Categories based on content`}
                  rows={12}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={handleBulkParse}
                  disabled={!bulkText.trim() || parsing}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: (!bulkText.trim() || parsing) ? '#d1d5db' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (!bulkText.trim() || parsing) ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {parsing ? 'Parsing...' : 'Parse Tasks'}
                </button>
              </div>

              {parsedTasks.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111', margin: 0 }}>
                      Parsed {parsedTasks.length} tasks
                    </h3>
                    <button
                      onClick={handleBulkSubmit}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Create All Tasks
                    </button>
                  </div>
                  
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {parsedTasks.map((task, index) => (
                      <div key={index} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: categoryConfig[task.category as TaskCategory]?.color || '#f3f4f6',
                            color: '#374151'
                          }}>
                            {categoryConfig[task.category as TaskCategory]?.label || 'Unknown'}
                          </span>
                          {task.dueDate && (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Due: {task.dueDate}</span>
                          )}
                          {task.progressTotal && (
                            <span style={{ fontSize: '12px', color: '#3b82f6' }}>Goal: {task.progressTotal}</span>
                          )}
                        </div>
                        <h4 style={{ fontWeight: '500', color: '#111', margin: '4px 0', fontSize: '14px' }}>{task.title}</h4>
                        {task.description && (
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0' }}>{task.description}</p>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Subtasks:</div>
                            <ul style={{ fontSize: '13px', color: '#6b7280', marginLeft: '16px', margin: 0, padding: 0 }}>
                              {task.subtasks.map((subtask: string, i: number) => (
                                <li key={i} style={{ marginBottom: '2px' }}>• {subtask}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};