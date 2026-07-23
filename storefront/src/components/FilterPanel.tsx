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
  const [filterSearch, setFilterSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    collections: true,
    spaces: false,
    styles: false,
    materials: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const searchQuery = filterSearch.trim().toLowerCase();

  // Helper to filter tags by search query
  const filterList = (items: string[]) => {
    if (!searchQuery) return items;
    return items.filter(item => item.toLowerCase().includes(searchQuery));
  };

  const filteredCollections = filterList(uniqueCollections);
  const filteredSpaces = filterList(uniqueSpaces);
  const filteredStyles = filterList(uniqueStyles);
  const filteredMaterials = filterList(uniqueMaterials);
  const isLedMatch = !searchQuery || 'led certified'.includes(searchQuery);

  const isSearching = searchQuery.length > 0;

  // Active counts per section
  const activeInCollections = uniqueCollections.filter(c => activeFilters.includes(c)).length;
  const activeInSpaces = uniqueSpaces.filter(s => activeFilters.includes(s)).length;
  const activeInStyles = uniqueStyles.filter(s => activeFilters.includes(s)).length;
  const activeInMaterials = uniqueMaterials.filter(m => activeFilters.includes(m)).length + (activeFilters.includes('LED Certified') ? 1 : 0);

  const accordionHeaderStyle = (isOpen: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: isOpen ? 'var(--surface2)' : 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)',
    borderRadius: isOpen ? '6px 6px 0 0' : '6px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.2s ease',
  });

  const accordionBodyStyle: React.CSSProperties = {
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderTop: 'none',
    borderRadius: '0 0 6px 6px',
    marginBottom: '10px',
  };

  const renderOptionRow = (item: string) => {
    const isActive = activeFilters.includes(item);
    return (
      <div
        key={item}
        onClick={() => toggleFilter(item)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background 0.2s',
          userSelect: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Custom Checkbox */}
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            border: isActive ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: isActive ? 'var(--gold)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          {isActive && <i className="ti ti-check" style={{ color: 'var(--obsidian)', fontSize: '12px', fontWeight: 700 }} />}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.06em',
            color: isActive ? 'var(--gold-light)' : 'var(--text-muted)',
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
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Search Bar inside Filter */}
      <div style={{ position: 'relative', width: '100%' }}>
        <i
          className="ti ti-search"
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px',
            color: 'var(--gold)',
          }}
        />
        <input
          type="text"
          placeholder="Search options (e.g. Chandelier, Foyer, Gold)..."
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 38px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {filterSearch && (
          <button
            onClick={() => setFilterSearch('')}
            style={{
              position: 'absolute',
              right: '14px',
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

      {/* Accordion List Container */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Section 1: Price Range Slider */}
        {!isSearching && (
          <div>
            <div
              style={accordionHeaderStyle(openSections.price)}
              onClick={() => toggleSection('price')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-currency-rupee" style={{ color: 'var(--gold)', fontSize: '14px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text)' }}>
                  Price Range
                </span>
                {priceActive && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '10px' }}>
                    Active
                  </span>
                )}
              </div>
              <i className={`ti ti-chevron-${openSections.price ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '14px' }} />
            </div>

            {openSections.price && (
              <div style={accordionBodyStyle}>
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
          </div>
        )}

        {/* Section 2: Collections / Categories */}
        {(uniqueCollections.length > 0 && (filteredCollections.length > 0 || !isSearching)) && (
          <div>
            <div
              style={accordionHeaderStyle(openSections.collections || isSearching)}
              onClick={() => toggleSection('collections')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-lamp" style={{ color: 'var(--gold)', fontSize: '14px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text)' }}>
                  Collections
                </span>
                {activeInCollections > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '10px' }}>
                    {activeInCollections} selected
                  </span>
                )}
              </div>
              <i className={`ti ti-chevron-${(openSections.collections || isSearching) ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '14px' }} />
            </div>

            {(openSections.collections || isSearching) && (
              <div style={accordionBodyStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredCollections.map(renderOptionRow)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Spaces */}
        {(uniqueSpaces.length > 0 && (filteredSpaces.length > 0 || !isSearching)) && (
          <div>
            <div
              style={accordionHeaderStyle(openSections.spaces || isSearching)}
              onClick={() => toggleSection('spaces')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-home" style={{ color: 'var(--gold)', fontSize: '14px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text)' }}>
                  Spaces
                </span>
                {activeInSpaces > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '10px' }}>
                    {activeInSpaces} selected
                  </span>
                )}
              </div>
              <i className={`ti ti-chevron-${(openSections.spaces || isSearching) ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '14px' }} />
            </div>

            {(openSections.spaces || isSearching) && (
              <div style={accordionBodyStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredSpaces.map(renderOptionRow)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Styles */}
        {(uniqueStyles.length > 0 && (filteredStyles.length > 0 || !isSearching)) && (
          <div>
            <div
              style={accordionHeaderStyle(openSections.styles || isSearching)}
              onClick={() => toggleSection('styles')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-palette" style={{ color: 'var(--gold)', fontSize: '14px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text)' }}>
                  Styles
                </span>
                {activeInStyles > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '10px' }}>
                    {activeInStyles} selected
                  </span>
                )}
              </div>
              <i className={`ti ti-chevron-${(openSections.styles || isSearching) ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '14px' }} />
            </div>

            {(openSections.styles || isSearching) && (
              <div style={accordionBodyStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredStyles.map(renderOptionRow)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 5: Materials & Features */}
        {(filteredMaterials.length > 0 || isLedMatch || !isSearching) && (
          <div>
            <div
              style={accordionHeaderStyle(openSections.materials || isSearching)}
              onClick={() => toggleSection('materials')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-sparkles" style={{ color: 'var(--gold)', fontSize: '14px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text)' }}>
                  Materials &amp; Features
                </span>
                {activeInMaterials > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '10px' }}>
                    {activeInMaterials} selected
                  </span>
                )}
              </div>
              <i className={`ti ti-chevron-${(openSections.materials || isSearching) ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '14px' }} />
            </div>

            {(openSections.materials || isSearching) && (
              <div style={accordionBodyStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredMaterials.map(renderOptionRow)}
                  {isLedMatch && renderOptionRow('LED Certified')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
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
            padding: '8px 0',
          }}
        >
          Clear All
        </button>

        <button
          onClick={onClose}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            background: 'var(--gold)',
            color: 'var(--obsidian)',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(201,168,76,0.2)',
          }}
        >
          Show {totalResultsCount} Products
        </button>
      </div>
    </div>
  );
}
