import React, { useState } from 'react';
import { File, Image, FileText, Download, Trash2, Eye, X, FileCode, FileJson, Table, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { theme } from '../../styles/theme';
import { useTaskStore } from '../../store/taskStore';
import type { Attachment } from '../../types';

interface AttachmentListProps {
  attachments: Attachment[];
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments }) => {
  const { deleteAttachment } = useTaskStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFileTypeInfo = (fileType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'rb', 'go', 'rs', 'php', 'sh', 'bash', 'zsh', 'sql'].includes(ext || '')) {
      return { icon: FileCode, color: '#667eea', bg: 'rgba(102, 126, 234, 0.1)' };
    }
    
    // Data files
    if (['json', 'jsonl', 'geojson'].includes(ext || '') || fileType.includes('json')) {
      return { icon: FileJson, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    }
    
    // Spreadsheet/Table files
    if (['csv', 'tsv', 'xls', 'xlsx'].includes(ext || '') || fileType.includes('csv') || fileType.includes('excel')) {
      return { icon: Table, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
    
    // Archive files
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext || '') || fileType.includes('zip') || fileType.includes('tar')) {
      return { icon: Archive, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
    }
    
    // Markup/Config files
    if (['xml', 'html', 'htm', 'yaml', 'yml', 'toml', 'ini', 'conf', 'config', 'env'].includes(ext || '')) {
      return { icon: FileCode, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    }
    
    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'md', 'markdown'].includes(ext || '') || fileType === 'application/pdf') {
      return { icon: FileText, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
    }
    
    // Images
    if (fileType.startsWith('image/')) {
      return { icon: Image, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' };
    }
    
    // Default
    return { icon: File, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    // Check by MIME type first
    if (fileType.startsWith('image/')) {
      return Image;
    } else if (fileType === 'application/pdf') {
      return FileText;
    } else if (fileType === 'application/json' || fileType === 'text/json') {
      return FileJson;
    } else if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel') {
      return Table;
    } else if (fileType.includes('zip') || fileType.includes('tar') || fileType.includes('rar') || fileType.includes('gz')) {
      return Archive;
    }
    
    // Check by file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
      case 'markdown':
        return FileText;
      case 'json':
      case 'jsonl':
      case 'geojson':
        return FileJson;
      case 'csv':
      case 'tsv':
      case 'xls':
      case 'xlsx':
        return Table;
      case 'xml':
      case 'html':
      case 'htm':
      case 'css':
      case 'scss':
      case 'sass':
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'h':
      case 'hpp':
      case 'rb':
      case 'go':
      case 'rs':
      case 'php':
      case 'sh':
      case 'bash':
      case 'zsh':
      case 'yaml':
      case 'yml':
      case 'toml':
      case 'ini':
      case 'conf':
      case 'config':
      case 'env':
      case 'sql':
        return FileCode;
      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
      case '7z':
        return Archive;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
      case 'odt':
        return FileText;
      default:
        return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = async (attachmentId: string) => {
    if (deletingId === attachmentId) {
      // Confirm delete on second click
      await deleteAttachment(attachmentId);
      setDeletingId(null);
    } else {
      // First click - show confirmation state
      setDeletingId(attachmentId);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: theme.spacing.md
      }}>
        {attachments.map(attachment => {
          const fileInfo = getFileTypeInfo(attachment.fileType, attachment.fileName);
          const IconComponent = fileInfo.icon;
          const isImage = attachment.fileType.startsWith('image/');

          return (
            <div
              key={attachment.id}
              style={{
                background: theme.colors.surface.glass,
                backdropFilter: theme.effects.blur,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.surface.glassBorder}`,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = theme.effects.shadow.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Preview Area */}
              <div
                style={{
                  height: '120px',
                  background: isImage 
                    ? `url(${attachment.thumbnailUrl || attachment.fileUrl}) center/cover`
                    : `linear-gradient(135deg, ${fileInfo.bg} 0%, ${fileInfo.bg} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
                onClick={() => isImage && setSelectedImage(attachment.fileUrl)}
              >
                {!isImage && (
                  <IconComponent 
                    className="w-12 h-12" 
                    style={{ color: fileInfo.color, opacity: 0.7 }} 
                  />
                )}

                {/* Action Buttons Overlay */}
                <div style={{
                  position: 'absolute',
                  top: theme.spacing.sm,
                  right: theme.spacing.sm,
                  display: 'flex',
                  gap: theme.spacing.xs
                }}>
                  {isImage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(attachment.fileUrl);
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: theme.borderRadius.md,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease'
                      }}
                      title="View image"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Eye className="w-4 h-4" style={{ color: theme.colors.primary.dark }} />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(attachment);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease'
                    }}
                    title="Download"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Download className="w-4 h-4" style={{ color: theme.colors.status.success.dark }} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(attachment.id);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      background: deletingId === attachment.id 
                        ? theme.colors.status.error.dark 
                        : 'rgba(255, 255, 255, 0.9)',
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease'
                    }}
                    title={deletingId === attachment.id ? 'Click again to confirm' : 'Delete'}
                    onMouseEnter={(e) => {
                      if (deletingId !== attachment.id) {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      if (deletingId !== attachment.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      }
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 
                      className="w-4 h-4" 
                      style={{ 
                        color: deletingId === attachment.id ? 'white' : theme.colors.status.error.dark 
                      }} 
                    />
                  </button>
                </div>
              </div>

              {/* File Info */}
              <div style={{ padding: theme.spacing.md }}>
                <p style={{
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {attachment.fileName}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: theme.typography.sizes.xs,
                  color: theme.colors.text.muted
                }}>
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span>{format(new Date(attachment.uploadedAt), 'MMM d, h:mm a')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: theme.spacing.xl,
              right: theme.spacing.xl,
              width: '48px',
              height: '48px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: theme.borderRadius.full,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X className="w-6 h-6" style={{ color: 'white' }} />
          </button>

          <img
            src={selectedImage}
            alt="Preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: theme.borderRadius.lg,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};