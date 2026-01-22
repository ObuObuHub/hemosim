'use client';

import React from 'react';

type TabId = 'labs' | 'cascade' | 'interactiv' | 'results';

interface MobileTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hasAbnormalFindings: boolean;
}

const FlaskIcon = (): React.ReactElement => (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M10 3v6.4a1 1 0 0 1-.2.6L4 18a2 2 0 0 0 1.6 3.2h12.8a2 2 0 0 0 1.6-3.2l-5.8-8a1 1 0 0 1-.2-.6V3" />
  </svg>
);

const CascadeIcon = (): React.ReactElement => (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="12" cy="18" r="3" />
    <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
    <path d="M12 15v0" />
  </svg>
);

const ResultsIcon = (): React.ReactElement => (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

const InteractivIcon = (): React.ReactElement => (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const tabs: Array<{ id: TabId; label: string; shortLabel: string; Icon: () => React.ReactElement }> = [
  { id: 'labs', label: 'Valori', shortLabel: 'Valori', Icon: FlaskIcon },
  { id: 'cascade', label: 'Cascadă', shortLabel: 'Cascadă', Icon: CascadeIcon },
  { id: 'interactiv', label: 'Interactiv', shortLabel: 'Joc', Icon: InteractivIcon },
  { id: 'results', label: 'Rezultate', shortLabel: 'Rezultate', Icon: ResultsIcon },
];

export function MobileTabBar({ activeTab, onTabChange, hasAbnormalFindings }: MobileTabBarProps): React.ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number): void => {
    const tabCount = tabs.length;
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      newIndex = (currentIndex + 1) % tabCount;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      newIndex = (currentIndex - 1 + tabCount) % tabCount;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabCount - 1;
    } else {
      return;
    }

    e.preventDefault();
    onTabChange(tabs[newIndex].id);
  };

  return (
    <nav className="mobile-tab-bar" role="tablist" aria-label="Navigare principală">
      {tabs.map(({ id, label, shortLabel, Icon }, index) => (
        <button
          key={id}
          id={`tab-${id}`}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`tabpanel-${id}`}
          aria-label={label}
          tabIndex={activeTab === id ? 0 : -1}
          className={`mobile-tab ${activeTab === id ? 'active' : ''}`}
          onClick={() => onTabChange(id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          <Icon />
          <span className="mobile-tab-label" aria-hidden="true">
            <span className="hidden [@media(min-width:361px)]:inline">{label}</span>
            <span className="[@media(min-width:361px)]:hidden">{shortLabel}</span>
          </span>
          {id === 'results' && hasAbnormalFindings && (
            <span className="mobile-tab-badge" aria-label="Există rezultate anormale" />
          )}
        </button>
      ))}
    </nav>
  );
}
