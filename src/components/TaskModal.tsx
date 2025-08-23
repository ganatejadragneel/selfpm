import React, { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import { useTaskStore } from '../store/taskStore';
import { X, Plus, Check, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose }) => {
  const { updateTask, addSubtask, toggleSubtask, addTaskUpdate, addNote } = useTaskStore();
  
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [newUpdate, setNewUpdate] = useState('');
  const [progressUpdate, setProgressUpdate] = useState('');
  const [newNote, setNewNote] = useState('');
  
  const [tempTitle, setTempTitle] = useState(task.title);
  const [tempDescription, setTempDescription] = useState(task.description || '');

  if (!isOpen) return null;

  const handleSaveTitle = () => {
    if (tempTitle.trim() && tempTitle !== task.title) {
      updateTask(task.id, { title: tempTitle.trim() });
    }
    setEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (tempDescription !== task.description) {
      updateTask(task.id, { description: tempDescription });
    }
    setEditingDescription(false);
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const handleAddUpdate = () => {
    if (newUpdate.trim()) {
      const progressValue = progressUpdate ? parseInt(progressUpdate) : undefined;
      addTaskUpdate(task.id, newUpdate.trim(), progressValue);
      setNewUpdate('');
      setProgressUpdate('');
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(task.id, newNote.trim());
      setNewNote('');
    }
  };

  const statusOptions: { value: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'todo', label: 'To Do', icon: <Clock className="w-4 h-4" />, color: 'text-gray-600' },
    { value: 'in_progress', label: 'In Progress', icon: <Clock className="w-4 h-4" />, color: 'text-blue-600' },
    { value: 'done', label: 'Done', icon: <Check className="w-4 h-4" />, color: 'text-green-600' },
    { value: 'blocked', label: 'Blocked', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1 mr-4">
            {editingTitle ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTempTitle(task.title);
                    setEditingTitle(false);
                  }
                }}
                className="text-2xl font-semibold w-full border rounded px-2 py-1"
                autoFocus
              />
            ) : (
              <h2
                className="text-2xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
                onClick={() => setEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={task.dueDate || ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Progress */}
            {task.progressTotal && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(task.progressCurrent || 0) / task.progressTotal * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={task.progressCurrent || 0}
                      onChange={(e) => updateTask(task.id, { progressCurrent: parseInt(e.target.value) || 0 })}
                      className="w-20 border rounded px-2 py-1 text-sm"
                      min="0"
                      max={task.progressTotal}
                    />
                    <span className="text-sm text-gray-600">/ {task.progressTotal}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              {editingDescription ? (
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  className="w-full border rounded-lg px-3 py-2 h-32 resize-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a description..."
                  autoFocus
                />
              ) : (
                <div
                  className="w-full border rounded-lg px-3 py-2 h-32 cursor-pointer hover:bg-gray-50 overflow-y-auto"
                  onClick={() => setEditingDescription(true)}
                >
                  {task.description ? (
                    <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">Click to add a description...</p>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtasks</label>
              <div className="space-y-2">
                {task.subtasks?.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    <button
                      onClick={() => toggleSubtask(subtask.id)}
                      className={clsx(
                        'w-5 h-5 rounded border-2 flex items-center justify-center',
                        subtask.isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {subtask.isCompleted && <Check className="w-3 h-3" />}
                    </button>
                    <span className={clsx(
                      'flex-1',
                      subtask.isCompleted && 'line-through text-gray-500'
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Add a subtask..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddSubtask}
                    disabled={!newSubtask.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Add Update */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Update</label>
              <div className="space-y-2">
                <textarea
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  placeholder="What progress did you make?"
                  className="w-full border rounded-lg px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-blue-500"
                />
                {task.progressTotal && (
                  <input
                    type="number"
                    value={progressUpdate}
                    onChange={(e) => setProgressUpdate(e.target.value)}
                    placeholder="New progress value (optional)"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max={task.progressTotal}
                  />
                )}
                <button
                  onClick={handleAddUpdate}
                  disabled={!newUpdate.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Add Update
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-1/3 border-l p-6 bg-gray-50 overflow-y-auto">
            {/* Recent Updates */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Recent Updates</h3>
              <div className="space-y-3">
                {task.updates?.slice(0, 5).map(update => (
                  <div key={update.id} className="text-sm">
                    <div className="text-xs text-gray-500 mb-1">
                      {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                    </div>
                    <div className="text-gray-900">{update.updateText}</div>
                    {update.progressValue !== undefined && (
                      <div className="text-xs text-blue-600 mt-1">
                        Progress: {update.progressValue}
                      </div>
                    )}
                  </div>
                ))}
                {!task.updates?.length && (
                  <p className="text-sm text-gray-500 italic">No updates yet</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
              <div className="space-y-3 mb-4">
                {task.notes?.slice(0, 3).map(note => (
                  <div key={note.id} className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-xs text-gray-500 mb-1">
                      {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                    </div>
                    <div className="text-gray-900 whitespace-pre-wrap">{note.content}</div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full border rounded-lg px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="w-full px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 text-sm"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};