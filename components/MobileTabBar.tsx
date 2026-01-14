'use client';

import React from 'react';

type TabId = 'labs' | 'cascade' | 'results';

interface MobileTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hasAbnormalFindings: boolean;
}

const FlaskIcon = (): React.ReactElement => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M10 3v6.4a1 1 0 0 1-.2.6L4 18a2 2 0 0 0 1.6 3.2h12.8a2 2 0 0 0 1.6-3.2l-5.8-8a1 1 0 0 1-.2-.6V3" />
  </svg>
);

const CascadeIcon = (): React.ReactElement => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="12" cy="18" r="3" />
    <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
    <path d="M12 15v0" />
  </svg>
);

const ResultsIcon = (): React.ReactElement => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

const tabs: Array<{ id: TabId; label: string; Icon: () => React.ReactElement }> = [
  { id: 'labs', label: 'Valori', Icon: FlaskIcon },
  { id: 'cascade', label: 'Cascadă', Icon: CascadeIcon },
  { id: 'results', label: 'Rezultate', Icon: ResultsIcon },
];

export function MobileTabBar({ activeTab, onTabChange, hasAbnormalFindings }: MobileTabBarProps): React.ReactElement {
  return (
    <nav className="mobile-tab-bar">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`mobile-tab ${activeTab === id ? 'active' : ''}`}
          onClick={() => onTabChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon />
          <span className="mobile-tab-label">{label}</span>
          {id === 'results' && hasAbnormalFindings && (
            <span className="mobile-tab-badge" aria-label="Valori anormale detectate" />
          )}
        </button>
      ))}
    </nav>
  );
}
