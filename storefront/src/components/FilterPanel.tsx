'use client';
import React, { useState } from 'react';
import PriceSlider from './PriceSlider';

type FilterPanelProps = {
  uniqueCollections: string[];
  uniqueSpaces: string[];
  uniqueStyles: string[];
  uniqueMaterials: string[];
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  clearAllFilters: () => void;
  globalMin: number;
  globalMax: number;
  priceMin: number;
  priceMax: number;
  setPriceMin: (val: number) => void;
  setPriceMax: (val: number) => void;
  priceActive: boolean;
  totalResultsCount: number;
  onClose: () => void;
};

type FilterTab = 'price' | 'collections' | 'spaces' | 'styles' | 'materials';

export default function FilterPanel({
  uniqueCollections,
  uniqueSpaces,
  uniqueStyles,
  uniqueMaterials,
  activeFilters,
  toggleFilter,
  clearAllFilters,
  globalMin,
  globalMax,
  priceMin,
  priceMax,
  setPriceMin,
  setPriceMax,
  priceActive,
  totalResultsCount,
  onClose,
}: FilterPanelProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('price');
  const [filterSearch, setFilterSearch] = useState('');

  const searchQuery = filterSearch.trim().toLowerCase();

  // Active count calculations per tab
  const activeInCollections = uniqueCollections.filter(c => activeFilters.includes(c)).length;
  const activeInSpaces = uniqueSpaces.filter(s => activeFilters.includes(s)).length;
  const activeInStyles = uniqueStyles.filter(st => activeFilters.includes(st)).length;
  const activeInMaterials = uniqueMaterials.filter(m => activeFilters.includes(m)).length + (activeFilters.includes('LED Certified') ? 1 : 0);

  // Filter list by search query
  const filterList = (items: string[]) => {
    if (!searchQuery) return items;
    return items.filter(item => item.toLowerCase().includes(searchQuery));
  };

  const filteredCollections = filterList(uniqueCollections);
  const filteredSpaces = filterList(uniqueSpaces);
  const filteredStyles = filterList(uniqueStyles);
  const filteredMaterials = filterList(uniqueMaterials);
  const isLedMatch = !searchQuery || 'led certified'.includes(searchQuery);

  // Define Nav Tabs
  const navTabs: { id: FilterTab; label: string; icon: string; count: number; activeFlag?: boolean }[] = [
    { id: 'price', label: 'Price Range', icon: 'ti-currency-rupee', count: 0, activeFlag: priceActive },
    { id: 'collections', label: 'Collections', icon: 'ti-lamp', count: activeInCollections },
    { id: 'spaces', label: 'Spaces', icon: 'ti-home', count: activeInSpaces },
    { id: 'styles', label: 'Styles', icon: 'ti-palette', count: activeInStyles },
    { id: 'materials', label: 'Materials & Specs', icon: 'ti-sparkles', count: activeInMaterials },
  ];

  // Helper to render checkbox option rows
  const renderOptionRow = (item: string) => {
    const isActive = activeFilters.includes(item);
    return (
      <div
        key={item}
        onClick={() => toggleFilter(item)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background 0.2s',
          userSelect: 'none',
          background: isActive ? 'rgba(201,168,76,0.06)' : 'transparent',
          border: isActive ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
        }}
        className="hover:!bg-[var(--surface2)]"
      >
        {/* Custom Checkbox */}
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            border: isActive ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: isActive ? 'var(--gold)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          {isActive && <i className="ti ti-check" style={{ color: 'var(--obsidian)', fontSize: '13px', fontWeight: 700 }} />}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.06em',
            color: isActive ? 'var(--gold-light)' : 'var(--text)',
            fontWeight: isActive ? 500 : 400,
          }}
        >
          {item}
        </span>
      </div>
    );
  };

  return (
    <div
      data-dropdown-area="true"
      style={{
        background: 'var(--obsidian)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
        width: '840px',
        maxWidth: '92vw',
        height: '520px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <i className="ti ti-adjustments-horizontal" style={{ fontSize: '18px', color: 'var(--gold)' }} />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontWeight: 400,
              color: 'var(--text)',
              letterSpacing: '0.04em',
            }}
          >
            Refine Selection
          </span>
        </div>

        {/* Search Input inside Header */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <i
            className="ti ti-search"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '13px',
              color: 'var(--gold)',
            }}
          />
          <input
            type="text"
            placeholder="Search filter options (e.g. Chandelier, Gold)..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              background: 'var(--obsidian)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          {filterSearch && (
            <button
              onClick={() => setFilterSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ✕
        </button>
      </div>

      {/* Main Split Body: Left Side Nav + Right Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Side Navigation Tabs */}
        <div
          style={{
            width: '220px',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.2)',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {navTabs.map(tab => {
            const isSelected = activeTab === tab.id;
            const hasBadge = tab.count > 0 || tab.activeFlag;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid var(--border-gold)' : '1px solid transparent',
                  background: isSelected ? 'var(--surface2)' : 'transparent',
                  color: isSelected ? 'var(--gold-light)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  position: 'relative',
                }}
              >
                {/* Gold Indicator Line */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '20%',
                      bottom: '20%',
                      width: '3px',
                      borderRadius: '0 2px 2px 0',
                      background: 'var(--gold)',
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`ti ${tab.icon}`} style={{ fontSize: '15px', color: isSelected ? 'var(--gold)' : 'inherit' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {tab.label}
                  </span>
                </div>

                {hasBadge && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      background: isSelected ? 'var(--gold)' : 'rgba(201,168,76,0.2)',
                      color: isSelected ? 'var(--obsidian)' : 'var(--gold)',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '10px',
                    }}
                  >
                    {tab.count > 0 ? tab.count : '•'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Active Content Area */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Price Range Tab */}
          {activeTab === 'price' && (
            <div style={{ maxWidth: '440px' }}>
              <PriceSlider
                min={globalMin}
                max={globalMax}
                currentMin={priceMin}
                currentMax={priceMax}
                onChange={(min, max) => {
                  setPriceMin(min);
                  setPriceMax(max);
                }}
                onReset={() => {
                  setPriceMin(globalMin);
                  setPriceMax(globalMax);
                }}
              />
            </div>
          )}

          {/* Collections Tab */}
          {activeTab === 'collections' && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                Select Collections ({filteredCollections.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {filteredCollections.map(renderOptionRow)}
              </div>
            </div>
          )}

          {/* Spaces Tab */}
          {activeTab === 'spaces' && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                Select Curated Spaces ({filteredSpaces.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {filteredSpaces.map(renderOptionRow)}
              </div>
            </div>
          )}

          {/* Styles Tab */}
          {activeTab === 'styles' && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                Select Architectural Styles ({filteredStyles.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {filteredStyles.map(renderOptionRow)}
              </div>
            </div>
          )}

          {/* Materials & Features Tab */}
          {activeTab === 'materials' && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                Select Materials &amp; Technical Specs ({filteredMaterials.length + (isLedMatch ? 1 : 0)})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {filteredMaterials.map(renderOptionRow)}
                {isLedMatch && renderOptionRow('LED Certified')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <button
          onClick={clearAllFilters}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Clear All Filters
        </button>

        <button
          onClick={onClose}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            background: 'var(--gold)',
            color: 'var(--obsidian)',
            border: 'none',
            padding: '12px 28px',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(201,168,76,0.25)',
          }}
        >
          Apply Filters ({totalResultsCount} Products)
        </button>
      </div>
    </div>
  );
}
