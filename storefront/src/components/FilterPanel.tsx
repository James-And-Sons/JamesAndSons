"use client";
import React, { useState } from "react";
import PriceSlider from "./PriceSlider";

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

type FilterTab = "price" | "collections" | "spaces" | "styles" | "materials";

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
  const [activeTab, setActiveTab] = useState<FilterTab>("price");
  const [filterSearch, setFilterSearch] = useState("");

  const searchQuery = filterSearch.trim().toLowerCase();

  // Active count calculations per tab
  const activeInCollections = uniqueCollections.filter((c) =>
    activeFilters.includes(c),
  ).length;
  const activeInSpaces = uniqueSpaces.filter((s) =>
    activeFilters.includes(s),
  ).length;
  const activeInStyles = uniqueStyles.filter((st) =>
    activeFilters.includes(st),
  ).length;
  const activeInMaterials =
    uniqueMaterials.filter((m) => activeFilters.includes(m)).length +
    (activeFilters.includes("LED Certified") ? 1 : 0);

  // Filter list by search query
  const filterList = (items: string[]) => {
    if (!searchQuery) return items;
    return items.filter((item) => item.toLowerCase().includes(searchQuery));
  };

  const filteredCollections = filterList(uniqueCollections);
  const filteredSpaces = filterList(uniqueSpaces);
  const filteredStyles = filterList(uniqueStyles);
  const filteredMaterials = filterList(uniqueMaterials);
  const isLedMatch = !searchQuery || "led certified".includes(searchQuery);

  // Define Nav Tabs
  const navTabs: {
    id: FilterTab;
    label: string;
    icon: string;
    count: number;
    activeFlag?: boolean;
  }[] = [
    {
      id: "price",
      label: "Price Range",
      icon: "ti-currency-rupee",
      count: 0,
      activeFlag: priceActive,
    },
    {
      id: "collections",
      label: "Collections",
      icon: "ti-lamp",
      count: activeInCollections,
    },
    { id: "spaces", label: "Spaces", icon: "ti-home", count: activeInSpaces },
    {
      id: "styles",
      label: "Styles",
      icon: "ti-palette",
      count: activeInStyles,
    },
    {
      id: "materials",
      label: "Materials & Specs",
      icon: "ti-sparkles",
      count: activeInMaterials,
    },
  ];

  // High Contrast Checkbox Option Row
  const renderOptionRow = (item: string) => {
    const isActive = activeFilters.includes(item);
    return (
      <div
        key={item}
        onClick={() => toggleFilter(item)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 14px",
          borderRadius: "6px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          userSelect: "none",
          background: isActive
            ? "rgba(201,168,76,0.18)"
            : "rgba(255,255,255,0.03)",
          border: isActive
            ? "1px solid var(--gold)"
            : "1px solid rgba(255,255,255,0.1)",
        }}
        className="hover:!bg-[rgba(255,255,255,0.09)]"
      >
        {/* Custom High-Contrast Checkbox */}
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "4px",
            border: isActive
              ? "1px solid var(--gold)"
              : "1px solid rgba(255,255,255,0.5)",
            background: isActive ? "var(--gold)" : "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
        >
          {isActive && (
            <i
              className="ti ti-check"
              style={{ color: "#000000", fontSize: "13px", fontWeight: 800 }}
            />
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: isActive ? "#F5E9C8" : "#FFFFFF",
            fontWeight: isActive ? 600 : 500,
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
        background: "var(--obsidian)",
        border: "1px solid var(--border-gold)",
        borderRadius: "10px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.95)",
        width: "840px",
        maxWidth: "92vw",
        height: "520px",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <i
            className="ti ti-adjustments-horizontal"
            style={{ fontSize: "20px", color: "var(--gold)" }}
          />
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "19px",
              fontWeight: 500,
              color: "#FFFFFF",
              letterSpacing: "0.04em",
            }}
          >
            Refine Selection
          </span>
        </div>

        {/* High-Contrast Search Input */}
        <div style={{ position: "relative", flex: 1, maxWidth: "360px" }}>
          <i
            className="ti ti-search"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
              color: "var(--gold)",
            }}
          />
          <input
            type="text"
            placeholder="Search options (e.g. Chandelier, Gold)..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              background: "var(--surface2)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(201,168,76,0.3)")
            }
          />
          {filterSearch && (
            <button
              onClick={() => setFilterSearch("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#CCCCCC",
                cursor: "pointer",
                fontSize: "12px",
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
            background: "none",
            border: "none",
            color: "#DDDDDD",
            cursor: "pointer",
            fontSize: "18px",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#DDDDDD")}
        >
          ✕
        </button>
      </div>

      {/* Main Split Body: Left Side Nav (Top horizontal on mobile) + Right Content */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Navigation Tabs (Horizontal scroll on mobile, Vertical column on desktop) */}
        <div className="w-full sm:w-[230px] flex-shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border)] bg-black/40 p-2.5 sm:p-4 flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto no-scrollbar">
          {navTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const hasBadge = tab.count > 0 || tab.activeFlag;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: isSelected
                    ? "1px solid var(--gold)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: isSelected
                    ? "rgba(201,168,76,0.18)"
                    : "var(--surface)",
                  color: isSelected ? "#FFFFFF" : "#D4D4D4",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  position: "relative",
                  whiteSpace: "nowrap",
                }}
                className="flex-shrink-0 sm:w-full"
              >
                {/* Gold Indicator Line */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "15%",
                      bottom: "15%",
                      width: "4px",
                      borderRadius: "0 2px 2px 0",
                      background: "var(--gold)",
                    }}
                    className="hidden sm:block"
                  />
                )}

                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <i
                    className={`ti ${tab.icon}`}
                    style={{
                      fontSize: "15px",
                      color: isSelected ? "var(--gold)" : "var(--gold-light)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {tab.label}
                  </span>
                </div>

                {hasBadge && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      background: isSelected
                        ? "var(--gold)"
                        : "rgba(201,168,76,0.25)",
                      color: isSelected ? "#000000" : "var(--gold-light)",
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: "10px",
                      marginLeft: "8px",
                    }}
                  >
                    {tab.count > 0 ? tab.count : "•"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Active Content Area */}
        <div
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            background: "var(--surface)",
          }}
        >
          {/* Price Range Tab */}
          {activeTab === "price" && (
            <div style={{ maxWidth: "460px" }}>
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
          {activeTab === "collections" && (
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--gold-light)",
                  marginBottom: "16px",
                  fontWeight: 600,
                }}
              >
                Select Collections ({filteredCollections.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredCollections.map(renderOptionRow)}
              </div>
            </div>
          )}

          {/* Spaces Tab */}
          {activeTab === "spaces" && (
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--gold-light)",
                  marginBottom: "16px",
                  fontWeight: 600,
                }}
              >
                Select Curated Spaces ({filteredSpaces.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredSpaces.map(renderOptionRow)}
              </div>
            </div>
          )}

          {/* Styles Tab */}
          {activeTab === "styles" && (
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--gold-light)",
                  marginBottom: "16px",
                  fontWeight: 600,
                }}
              >
                Select Architectural Styles ({filteredStyles.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredStyles.map(renderOptionRow)}
              </div>
            </div>
          )}

          {/* Materials & Features Tab */}
          {activeTab === "materials" && (
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--gold-light)",
                  marginBottom: "16px",
                  fontWeight: 600,
                }}
              >
                Select Materials &amp; Technical Specs (
                {filteredMaterials.length + (isLedMatch ? 1 : 0)})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMaterials.map(renderOptionRow)}
                {isLedMatch && renderOptionRow("LED Certified")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <button
          onClick={clearAllFilters}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#DDDDDD",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#DDDDDD")}
        >
          Clear All Filters
        </button>

        <button
          onClick={onClose}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            background: "var(--gold)",
            color: "#000000",
            border: "none",
            padding: "12px 28px",
            borderRadius: "4px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(201,168,76,0.3)",
          }}
        >
          Show {totalResultsCount} Products
        </button>
      </div>
    </div>
  );
}
