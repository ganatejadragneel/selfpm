// AppShell — the persistent top shell on every screen.
// Left = nav tabs (the *consume* surfaces: Dashboard | CPO Reports | Pages).
// Right = the Capture cluster (the *capture* actions: + ORE / + Note / + Page),
// one visual unit, color-distinct from nav, reachable from anywhere.
//
// Router-agnostic: it takes `activeTab` + callbacks, so it drops into the real
// react-router app (map onTabChange → navigate) AND renders in a standalone
// preview. Matches SelfPM's glass + purple-gradient language.

import { LayoutDashboard, ScrollText, Files, Plus, Shield, CalendarDays } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';

export type ShellTab = 'dashboard' | 'cpo-reports' | 'pages';

const TABS: { id: ShellTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cpo-reports', label: 'CPO Reports', icon: ScrollText },
  { id: 'pages', label: 'Pages', icon: Files },
];

const CAPTURE: { key: string; label: string }[] = [
  { key: 'ore', label: 'ORE' },
  { key: 'note', label: 'Note' },
  { key: 'page', label: 'Page' },
];

export interface AppShellProps {
  activeTab: ShellTab;
  onTabChange: (tab: ShellTab) => void;
  onCapture: (kind: 'ore' | 'note' | 'page') => void;
  onPrivacyPledge?: () => void;   // opens the Privacy Pledge modal (global)
  onOreReport?: () => void;       // opens Daily Analytics / ORE reporting (global)
  rightSlot?: React.ReactNode;    // e.g. <UserMenu /> in the real app
}

export function AppShell({ activeTab, onTabChange, onCapture, onPrivacyPledge, onOreReport, rightSlot }: AppShellProps) {
  const t = useThemeColors();
  const c = t.colors;
  // SelfPM's first entry was 2025-09-02; the year rolls on each anniversary.
  const yearNumber = Math.max(1, Math.floor((Date.now() - Date.UTC(2025, 8, 2)) / (365.25 * 24 * 3600 * 1000)) + 1);
  const dark = t.currentTheme === 'dark';

  const glass = c.surface.glass;
  const border = c.surface.glassBorder;
  // capture accent: teal — additive/"create", deliberately NOT the purple nav accent
  const capAccent = '#0d9488';
  const capTint = dark ? 'rgba(13,148,136,0.18)' : 'rgba(13,148,136,0.08)';
  const capBorder = dark ? 'rgba(13,148,136,0.4)' : 'rgba(13,148,136,0.22)';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: glass,
        backdropFilter: t.effects.blur,
        WebkitBackdropFilter: t.effects.blur,
        borderBottom: `1px solid ${border}`,
        boxShadow: t.effects.shadow.md,
      }}
    >
      <style>{`
        .shell-tab { transition: all .18s ease; }
        .shell-tab:hover:not(.is-active) { background: rgba(102,126,234,0.10); color: #4f5bd5; }
        .shell-cap { transition: all .18s ease; }
        .shell-cap:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(13,148,136,0.22); }
        .shell-cap:active { transform: translateY(0); }
        .shell-util { transition: all .18s ease; }
        .shell-util:hover { background: rgba(102,126,234,0.12); color: #4f5bd5; border-color: rgba(102,126,234,0.3); }
      `}</style>

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundImage: c.primary.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 16,
              boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
            }}
          >
            S
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              backgroundImage: c.primary.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            SelfPM
          </span>
          {/* Year marker. SelfPM began 2025-09-02; year 2 opens on the anniversary.
              Computed rather than hardcoded so it never needs remembering. */}
          <span
            title={`Year ${yearNumber} of SelfPM`}
            style={{
              ...t.typography.label,
              color: c.text.muted,
              border: `1px solid ${c.border.light}`,
              borderRadius: 999,
              padding: '3px 7px',
              lineHeight: 1,
              flex: 'none',
            }}
          >
            YR {yearNumber}
          </span>
        </div>

        {/* Nav tabs — segmented control */}
        <nav
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(102,126,234,0.06)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(102,126,234,0.10)'}`,
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === activeTab;
            return (
              <button
                key={id}
                className={`shell-tab${active ? ' is-active' : ''}`}
                onClick={() => onTabChange(id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 14px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 600,
                  color: active ? '#fff' : c.text.secondary,
                  background: active ? c.primary.gradient : 'transparent',
                  boxShadow: active ? '0 4px 14px rgba(102,126,234,0.35)' : 'none',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Capture cluster — one bounded unit, distinct teal accent */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: capTint,
            border: `1px solid ${capBorder}`,
            flex: 'none',
          }}
        >
          {CAPTURE.map(({ key, label }) => (
            <button
              key={key}
              className="shell-cap"
              onClick={() => onCapture(key as 'ore' | 'note' | 'page')}
              title={`Add ${label}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 9,
                border: `1px solid ${capBorder}`,
                background: dark ? 'rgba(13,148,136,0.12)' : '#ffffff',
                color: capAccent,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} strokeWidth={2.6} />
              {label}
            </button>
          ))}
        </div>

        {/* Utility actions — Privacy Pledge + ORE reporting (global modals) */}
        {(onPrivacyPledge || onOreReport) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
            {onPrivacyPledge && (
              <button
                className="shell-util"
                onClick={onPrivacyPledge}
                title="Privacy Pledge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 9,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  color: c.text.secondary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Shield size={15} />
                Privacy
              </button>
            )}
            {onOreReport && (
              <button
                className="shell-util"
                onClick={onOreReport}
                title="Daily Analytics (ORE reporting)"
                aria-label="ORE reporting"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  color: c.text.secondary,
                  cursor: 'pointer',
                }}
              >
                <CalendarDays size={16} />
              </button>
            )}
          </div>
        )}

        {/* Right slot (UserMenu in the real app; avatar placeholder in preview) */}
        <div style={{ flex: 'none' }}>
          {rightSlot ?? (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: c.primary.light,
                border: `1px solid ${border}`,
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}

export default AppShell;
