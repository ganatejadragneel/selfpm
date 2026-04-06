import React from 'react';
import { Calendar, Copy, Plus } from 'lucide-react';
import { getCurrentSprintDates } from '../../constants/sprint';

interface StartNewSprintScreenProps {
  onStartFresh: () => Promise<void>;
  onCloneLast: () => Promise<void>;
  completedSprintCount: number;
  loading: boolean;
}

export const StartNewSprintScreen: React.FC<StartNewSprintScreenProps> = ({
  onStartFresh,
  onCloneLast,
  completedSprintCount,
  loading,
}) => {
  const { startDate, endDate } = getCurrentSprintDates();
  const isFirstSprint = completedSprintCount === 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '32px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Calendar size={28} color="#fff" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: '#f8fafc' }}>
          No Active Sprint
        </h2>
        <p style={{ color: '#94a3b8', margin: 0 }}>
          {startDate} → {endDate}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {!isFirstSprint && (
          <button
            onClick={onCloneLast}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 24px', borderRadius: '12px', border: 'none',
              background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Copy size={18} />
            Clone Last Sprint
          </button>
        )}
        <button
          onClick={onStartFresh}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 24px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Plus size={18} />
          Start Fresh
        </button>
      </div>
    </div>
  );
};
