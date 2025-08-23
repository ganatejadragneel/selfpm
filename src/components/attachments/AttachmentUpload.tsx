import React, { useRef, useState } from 'react';
import { Upload, Loader } from 'lucide-react';
import { theme } from '../../styles/theme';
import { useTaskStore } from '../../store/taskStore';

interface AttachmentUploadProps {
  taskId: string;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({ taskId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { uploadAttachment } = useTaskStore();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await uploadAttachment(taskId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.xml,.json,.md,.yaml,.yml,.log,.sql,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.hpp,.rb,.go,.rs,.php,.sh,.bash,.zsh,.env,.config,.conf,.ini,.toml,.lock,.gitignore,.dockerignore,Dockerfile,.zip,.tar,.gz,.rar"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${isDragging ? theme.colors.primary.dark : 'rgba(102, 126, 234, 0.3)'}`,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          background: isDragging 
            ? 'rgba(102, 126, 234, 0.05)' 
            : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: theme.effects.blur,
          transition: 'all 0.2s ease',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'rgba(102, 126, 234, 0.1)'
          }}>
            <div style={{
              height: '100%',
              width: `${uploadProgress}%`,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: theme.spacing.md,
          textAlign: 'center'
        }}>
          {uploading ? (
            <Loader 
              className="w-8 h-8" 
              style={{ 
                color: theme.colors.primary.dark,
                animation: 'spin 1s linear infinite'
              }} 
            />
          ) : (
            <Upload 
              className="w-8 h-8" 
              style={{ color: theme.colors.primary.dark }} 
            />
          )}
          
          <div>
            <p style={{
              fontSize: theme.typography.sizes.base,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs
            }}>
              {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
            </p>
            <p style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.muted
            }}>
              Maximum file size: 10MB
            </p>
            <p style={{
              fontSize: theme.typography.sizes.xs,
              color: theme.colors.text.muted,
              marginTop: theme.spacing.xs
            }}>
              Supported: Images, Documents, Code files, Data files (CSV, JSON, XML), Archives, and more
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};