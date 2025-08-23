import React from 'react';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestModal: React.FC<TestModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '400px'
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#111' }}>
          🎉 Test Modal Working!
        </h2>
        <p style={{ color: '#555', marginBottom: '16px' }}>
          Great! The modal system is working properly.
        </p>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
          Debug: isOpen = {String(isOpen)}
        </div>
        <button
          onClick={() => {
            console.log('Test modal close clicked');
            onClose();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close Modal
        </button>
      </div>
    </div>
  );
};