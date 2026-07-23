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

  // Auto-expand sections if search query is entered
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
    padding: '16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderTop: 'none',
    borderRadius: '0 0 6px 6px',
    marginBottom: '12px',
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
        maxWidth: '720px',
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
          placeholder="Search filter options (e.g. Chandelier, Gold, LED)..."
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
        {/* Section 1: Price Range */}
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
                    setPriceMin(0);
                    setPriceMax(999999999);
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {filteredCollections.map(c => {
                    const isActive = activeFilters.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleFilter(c)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: isActive ? '1px solid var(--gold)' : '1px solid var(--border)',
                          background: isActive ? 'var(--gold)' : 'var(--surface2)',
                          color: isActive ? 'var(--obsidian)' : 'var(--text)',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {filteredSpaces.map(s => {
                    const isActive = activeFilters.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleFilter(s)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: isActive ? '1px solid var(--gold)' : '1px solid var(--border)',
                          background: isActive ? 'var(--gold)' : 'var(--surface2)',
                          color: isActive ? 'var(--obsidian)' : 'var(--text)',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {filteredStyles.map(st => {
                    const isActive = activeFilters.includes(st);
                    return (
                      <button
                        key={st}
                        onClick={() => toggleFilter(st)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: isActive ? '1px solid var(--gold)' : '1px solid var(--border)',
                          background: isActive ? 'var(--gold)' : 'var(--surface2)',
                          color: isActive ? 'var(--obsidian)' : 'var(--text)',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {st}
                      </button>
                    );
                  })}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {filteredMaterials.map(m => {
                    const isActive = activeFilters.includes(m);
                    return (
                      <button
                        key={m}
                        onClick={() => toggleFilter(m)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: isActive ? '1px solid var(--gold)' : '1px solid var(--border)',
                          background: isActive ? 'var(--gold)' : 'var(--surface2)',
                          color: isActive ? 'var(--obsidian)' : 'var(--text)',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                  {isLedMatch && (
                    <button
                      onClick={() => toggleFilter('LED Certified')}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: activeFilters.includes('LED Certified') ? '1px solid var(--gold)' : '1px solid var(--border)',
                        background: activeFilters.includes('LED Certified') ? 'var(--gold)' : 'var(--surface2)',
                        color: activeFilters.includes('LED Certified') ? 'var(--obsidian)' : 'var(--text)',
                        fontWeight: activeFilters.includes('LED Certified') ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      LED Certified
                    </button>
                  )}
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
