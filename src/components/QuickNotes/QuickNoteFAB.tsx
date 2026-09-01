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
        className="fixed bottom-7 right-7 flex flex-col items-end gap-3 z-[900]"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Speed-dial options */}
        <div
          className="flex flex-col items-end gap-[10px] [transform-origin:bottom_right] [transition:opacity_0.2s,transform_0.25s_cubic-bezier(.34,1.56,.64,1)]"
          style={{
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'all' : 'none',
            transform: open ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(16px)',
          }}
        >
          {/* View All Notes */}
          <div
            className="flex items-center gap-[10px] cursor-pointer"
            onClick={() => { setOpen(false); navigate('/allNotes'); }}
          >
            <span
              className="rounded-[20px] py-[7px] px-[14px] text-[13px] font-medium whitespace-nowrap"
              style={{
                ...glassBase,
                color: theme.colors.text.primary,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >View All Notes</span>
            <button
              className="w-11 h-11 rounded-full border-none flex items-center justify-center cursor-pointer shrink-0 transition-transform duration-[150ms]"
              style={{
                background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
                boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <FileText size={18} color="white" />
            </button>
          </div>

          {/* Add Quick Note */}
          <div
            className="flex items-center gap-[10px] cursor-pointer"
            onClick={() => { setOpen(false); setShowModal(true); }}
          >
            <span
              className="rounded-[20px] py-[7px] px-[14px] text-[13px] font-medium whitespace-nowrap"
              style={{
                ...glassBase,
                color: theme.colors.text.primary,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >Add Quick Note</span>
            <button
              className="w-11 h-11 rounded-full border-none bg-brand-gradient flex items-center justify-center cursor-pointer shrink-0 transition-transform duration-[150ms]"
              style={{
                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
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
          className="w-[52px] h-[52px] rounded-full border-none bg-brand-gradient flex items-center justify-center cursor-pointer z-[901]"
          style={{
            boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
            transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <div
            className="flex items-center justify-center transition-transform duration-300 ease-[ease]"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            {open ? <X size={22} color="white" /> : <ChevronUp size={22} color="white" />}
          </div>
        </button>
      </div>

      {showModal && <QuickNoteAddModal onClose={() => setShowModal(false)} />}
    </>,
    document.body
  );
};
