import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, X, Plus, FileText } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { QuickNoteAddModal } from './QuickNoteAddModal';

export const QuickNoteFAB: React.FC = () => {
  const theme = useThemeColors();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isDark = theme.currentTheme === 'dark';

  const glassBase: React.CSSProperties = {
    background: isDark ? 'rgba(18,20,28,0.92)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${theme.colors.surface.glassBorder}`,
  };

  return createPortal(
    <>
      {/* Speed-dial container */}
      <div
        id="qn-fab-root"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px',
          zIndex: 900,
        }}
      >
        {/* Speed-dial options */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'all' : 'none',
            transform: open ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(16px)',
            transformOrigin: 'bottom right',
            transition: 'opacity 0.2s, transform 0.25s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          {/* View All Notes */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => { setOpen(false); navigate('/allNotes'); }}
          >
            <span style={{
              ...glassBase,
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: theme.colors.text.primary,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>View All Notes</span>
            <button style={{
              width: '44px', height: '44px', borderRadius: '50%', border: 'none',
              background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
              transition: 'transform 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <FileText size={18} color="white" />
            </button>
          </div>

          {/* Add Quick Note */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => { setOpen(false); setShowModal(true); }}
          >
            <span style={{
              ...glassBase,
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: theme.colors.text.primary,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>Add Quick Note</span>
            <button style={{
              width: '44px', height: '44px', borderRadius: '50%', border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              transition: 'transform 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Plus size={18} color="white" />
            </button>
          </div>
        </div>

        {/* Main FAB trigger */}
        <button
          style={{
            width: '52px', height: '52px', borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
            transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s',
            zIndex: 901,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <div style={{
            transition: 'transform 0.3s ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {open ? <X size={22} color="white" /> : <ChevronUp size={22} color="white" />}
          </div>
        </button>
      </div>

      {showModal && <QuickNoteAddModal onClose={() => setShowModal(false)} />}
    </>,
    document.body
  );
};
