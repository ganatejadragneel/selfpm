import React, { useState } from 'react';
import type { TaskCategory } from '../types';
import { useTaskStore } from '../store/taskStore';
import { parseTaskText, parseStructuredText } from '../utils/taskParser';
import { X, Zap, FileText, Sparkles } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  initialCategory: TaskCategory;
  onClose: () => void;
}

const categoryConfig = {
  life_admin: { label: 'Life Admin', color: 'bg-blue-100 text-blue-900' },
  work: { label: 'Work Tasks', color: 'bg-green-100 text-green-900' },
  weekly_recurring: { label: 'Weekly Tasks', color: 'bg-purple-100 text-purple-900' }
};

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, initialCategory, onClose }) => {
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
      // Try structured parsing first (for detailed inputs like PM example)
      let parsed = parseStructuredText(bulkText);
      
      // If no structured tasks found, try general parsing
      if (parsed.length === 0) {
        parsed = parseTaskText(bulkText);
      }
      
      // Set default category for all parsed tasks
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

        // Add subtasks if any
        if (taskData.subtasks && taskData.subtasks.length > 0) {
          // We'll need the task ID, so we'd need to refactor the store to return the created task
          // For now, we'll skip subtasks in bulk creation
        }
      }
      
      setBulkText('');
      setParsedTasks([]);
      onClose();
    } catch (error) {
      console.error('Error creating bulk tasks:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Add Tasks</h2>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('single')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  mode === 'single'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-1" />
                Quick Add
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  mode === 'bulk'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Bulk Add
              </button>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(categoryConfig) as TaskCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    category === cat
                      ? 'border-blue-500 ' + categoryConfig[cat].color
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  {categoryConfig[cat].label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'single' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Progress Goal (optional)</label>
                  <input
                    type="number"
                    value={progressTotal}
                    onChange={(e) => setProgressTotal(e.target.value)}
                    placeholder="e.g. 50 for 50 pages"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {category === 'weekly_recurring' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="recurring" className="text-sm text-gray-700">
                    This task repeats weekly
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSingleSubmit}
                  disabled={!title.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Task
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Paste your task list
                  </label>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-gray-500">AI-powered parsing</span>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste your task list here. For example:

1. Review blood test results and identify next steps
2. Complete 50 user stories for work project
3. Read 80 pages of Team of Teams book
4. Order birthday gift for friend next week

The system will automatically detect:
- Task numbers and subtasks
- Progress goals (numbers like '50 stories', '80 pages')  
- Due dates ('next week', 'Friday', etc.)
- Categories based on content"
                  rows={12}
                  className="w-full border rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBulkParse}
                  disabled={!bulkText.trim() || parsing}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {parsing ? 'Parsing...' : 'Parse Tasks'}
                </button>
              </div>

              {parsedTasks.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      Parsed {parsedTasks.length} tasks
                    </h3>
                    <button
                      onClick={handleBulkSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create All Tasks
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {parsedTasks.map((task, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            categoryConfig[task.category as TaskCategory]?.color || 'bg-gray-100 text-gray-700'
                          }`}>
                            {categoryConfig[task.category as TaskCategory]?.label || 'Unknown'}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">Due: {task.dueDate}</span>
                          )}
                          {task.progressTotal && (
                            <span className="text-xs text-blue-600">Goal: {task.progressTotal}</span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">Subtasks:</div>
                            <ul className="text-sm text-gray-600 ml-4">
                              {task.subtasks.map((subtask: string, i: number) => (
                                <li key={i} className="list-disc">• {subtask}</li>
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