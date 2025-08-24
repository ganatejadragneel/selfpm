import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Eye, EyeOff } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { theme } from '../styles/theme';
import type { TaskCategory } from '../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CSVRow {
  'Task Name': string;
  'Description'?: string;
  'Due Date'?: string;
  'Task Type'?: string;
}

interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: string;
  category: TaskCategory;
  isValid: boolean;
  errors: string[];
}

const SAMPLE_CSV = `Task Name,Description,Due Date,Task Type
Pay electricity bill,Monthly utility payment,2024-01-31,life
Team meeting preparation,Prepare slides for quarterly review,2024-01-25,work
Grocery shopping,Weekly grocery run,2024-01-27,weekly
Doctor appointment,Annual checkup,,life
Project deadline,Submit final deliverables,2024-02-01,work`;

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
  const { createTask } = useTaskStore();
  const [file, setFile] = useState<File | null>(null);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  if (!isOpen) return null;

  const normalizeTaskType = (type?: string): TaskCategory => {
    if (!type) return 'life_admin';
    
    const normalized = type.toLowerCase().trim();
    
    // Map various inputs to our categories
    const mappings: Record<string, TaskCategory> = {
      'life': 'life_admin',
      'life_admin': 'life_admin',
      'life admin': 'life_admin',
      'personal': 'life_admin',
      'work': 'work',
      'work tasks': 'work',
      'professional': 'work',
      'weekly': 'weekly_recurring',
      'weekly_recurring': 'weekly_recurring',
      'weekly recurring': 'weekly_recurring',
      'recurring': 'weekly_recurring'
    };
    
    return mappings[normalized] || 'life_admin';
  };

  const validateDate = (dateStr?: string): string | undefined => {
    if (!dateStr || dateStr.trim() === '') return undefined;
    
    // Try to parse the date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    
    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  };

  const parseCSV = (file: File) => {
    setIsProcessing(true);
    setErrorMessage('');
    setUploadStatus('idle');

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const tasks: ParsedTask[] = results.data.map((row, index) => {
          const errors: string[] = [];
          
          // Validate task name
          const taskName = row['Task Name']?.trim();
          if (!taskName) {
            errors.push(`Row ${index + 2}: Task name is required`);
          }
          
          // Parse and validate due date
          const dueDate = validateDate(row['Due Date']);
          if (row['Due Date'] && !dueDate) {
            errors.push(`Row ${index + 2}: Invalid date format`);
          }
          
          // Normalize task type
          const category = normalizeTaskType(row['Task Type']);
          
          return {
            title: taskName || '',
            description: row['Description']?.trim(),
            dueDate,
            category,
            isValid: errors.length === 0 && !!taskName,
            errors
          };
        });
        
        setParsedTasks(tasks);
        setIsProcessing(false);
        
        // Check if there are any errors
        const hasErrors = tasks.some(t => !t.isValid);
        if (hasErrors) {
          setUploadStatus('error');
          setErrorMessage('Some tasks have validation errors. Please review below.');
        }
      },
      error: (error) => {
        setIsProcessing(false);
        setUploadStatus('error');
        setErrorMessage(`Failed to parse CSV: ${error.message}`);
        setParsedTasks([]);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setFile(file);
      parseCSV(file);
    } else {
      setUploadStatus('error');
      setErrorMessage('Please upload a valid CSV file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      setFile(file);
      parseCSV(file);
    } else {
      setUploadStatus('error');
      setErrorMessage('Please upload a valid CSV file');
    }
  };

  const handleImport = async () => {
    const validTasks = parsedTasks.filter(t => t.isValid);
    if (validTasks.length === 0) {
      setErrorMessage('No valid tasks to import');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create all tasks
      for (const task of validTasks) {
        await createTask({
          title: task.title,
          description: task.description,
          category: task.category,
          dueDate: task.dueDate,
          priority: 'medium',
          status: 'todo'
        });
      }
      
      setUploadStatus('success');
      setErrorMessage('');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        // Reset state
        setFile(null);
        setParsedTasks([]);
        setUploadStatus('idle');
      }, 1500);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Failed to import tasks. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_tasks.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: TaskCategory) => {
    const colors = {
      life_admin: theme.colors.status.info.light,
      work: theme.colors.status.success.light,
      weekly_recurring: theme.colors.status.purple.light
    };
    return colors[category];
  };

  const getCategoryLabel = (category: TaskCategory) => {
    const labels = {
      life_admin: 'Life Admin',
      work: 'Work',
      weekly_recurring: 'Weekly'
    };
    return labels[category];
  };

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px 32px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                marginBottom: '8px'
              }}>
                Bulk Upload Tasks
              </h2>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                margin: 0
              }}>
                Import multiple tasks from a CSV file
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
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
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '32px',
          overflow: 'auto'
        }}>
          {/* Upload Area */}
          {!file && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                border: '2px dashed #e5e7eb',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                backgroundColor: 'rgba(102, 126, 234, 0.02)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.02)';
              }}
            >
              <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: '#667eea' }} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Drop your CSV file here or click to browse
              </h3>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                marginBottom: '24px'
              }}>
                File should contain: Task Name, Description, Due Date, Task Type
              </p>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginRight: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5a67d8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Choose File
              </label>
              
              <button
                onClick={downloadSampleCSV}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Download className="w-4 h-4" />
                Download Sample CSV
              </button>
            </div>
          )}

          {/* File Selected */}
          {file && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: 'rgba(102, 126, 234, 0.05)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText className="w-5 h-5" style={{ color: '#667eea' }} />
                <div>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    margin: 0
                  }}>
                    {file.name}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: theme.colors.text.secondary,
                    margin: 0
                  }}>
                    {parsedTasks.length} tasks found
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setParsedTasks([]);
                  setUploadStatus('idle');
                  setErrorMessage('');
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.text.secondary,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.status.error.dark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.text.secondary;
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: theme.colors.status.error.dark
            }}>
              <AlertCircle className="w-5 h-5" />
              <p style={{ margin: 0, fontSize: '14px' }}>{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === 'success' && (
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: theme.colors.status.success.dark
            }}>
              <CheckCircle className="w-5 h-5" />
              <p style={{ margin: 0, fontSize: '14px' }}>
                Successfully imported {parsedTasks.filter(t => t.isValid).length} tasks!
              </p>
            </div>
          )}

          {/* Preview Toggle */}
          {parsedTasks.length > 0 && (
            <div style={{
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                margin: 0
              }}>
                Preview ({parsedTasks.filter(t => t.isValid).length} valid, {parsedTasks.filter(t => !t.isValid).length} invalid)
              </h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#667eea',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
          )}

          {/* Tasks Preview */}
          {parsedTasks.length > 0 && showPreview && (
            <div style={{
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Task Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Due Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTasks.map((task, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: task.isValid ? 'white' : 'rgba(239, 68, 68, 0.05)'
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div>
                          <p style={{
                            margin: 0,
                            fontWeight: '500',
                            color: task.isValid ? theme.colors.text.primary : theme.colors.status.error.dark
                          }}>
                            {task.title || '(empty)'}
                          </p>
                          {task.description && (
                            <p style={{
                              margin: 0,
                              fontSize: '12px',
                              color: theme.colors.text.secondary,
                              marginTop: '4px'
                            }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: getCategoryColor(task.category),
                          color: theme.colors.text.primary
                        }}>
                          {getCategoryLabel(task.category)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: theme.colors.text.secondary }}>
                        {task.dueDate || '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {task.isValid ? (
                          <CheckCircle className="w-5 h-5 mx-auto" style={{ color: theme.colors.status.success.dark }} />
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <AlertCircle className="w-5 h-5 mx-auto" style={{ color: theme.colors.status.error.dark }} />
                            {task.errors.length > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                padding: '8px',
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                                color: theme.colors.status.error.dark,
                                whiteSpace: 'nowrap',
                                display: 'none',
                                zIndex: 10
                              }}>
                                {task.errors.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedTasks.length > 0 && (
          <div style={{
            padding: '24px 32px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9ca3af';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isProcessing || parsedTasks.filter(t => t.isValid).length === 0}
              style={{
                padding: '12px 24px',
                backgroundColor: isProcessing || parsedTasks.filter(t => t.isValid).length === 0 ? '#9ca3af' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: isProcessing || parsedTasks.filter(t => t.isValid).length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isProcessing && parsedTasks.filter(t => t.isValid).length > 0) {
                  e.currentTarget.style.backgroundColor = '#5a67d8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing && parsedTasks.filter(t => t.isValid).length > 0) {
                  e.currentTarget.style.backgroundColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isProcessing ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import {parsedTasks.filter(t => t.isValid).length} Tasks
                </>
              )}
            </button>
          </div>
        )}

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};