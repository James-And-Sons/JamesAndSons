"use client";

import React, { useEffect, useState } from "react";
import { Sliders } from "lucide-react";

interface AttributeDef {
  id: string;
  name: string;
  key: string;
  type: string;
  options?: string[] | null;
  isRequired?: boolean;
}

interface DynamicAttributesSectionProps {
  customAttributes: Record<string, any>;
  onChange: (attributes: Record<string, any>) => void;
}

export default function DynamicAttributesSection({
  customAttributes,
  onChange,
}: DynamicAttributesSectionProps) {
  const [attributeDefs, setAttributeDefs] = useState<AttributeDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attributes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAttributeDefs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (key: string, val: any) => {
    onChange({
      ...customAttributes,
      [key]: val,
    });
  };

  return (
    <div
      id="attributes"
      className="p-6 bg-surface border border-border rounded-xl space-y-4 shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-gold" />
          <h3 className="font-serif font-bold text-base text-text">
            White-Label Custom Attributes
          </h3>
        </div>
        <span className="text-[10px] font-mono uppercase bg-gold/15 text-gold px-2 py-0.5 rounded border border-gold/30">
          Dynamic Schema
        </span>
      </div>

      <p className="text-xs text-textMuted">
        Configured dynamic attributes for your product tenant ecosystem.
        Definitions are managed in your white-label tenant schema.
      </p>

      {loading ? (
        <div className="text-xs font-mono text-textMuted py-4">
          Loading Schema Attributes...
        </div>
      ) : attributeDefs.length === 0 ? (
        <div className="p-4 bg-background/50 border border-border/60 rounded-lg text-xs text-textMuted text-center">
          No custom attribute definitions added yet. Custom attributes (e.g.
          Lumens, Bulb Count, Material Finish, Warranty Years) can be configured
          for your catalog.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {attributeDefs.map((def) => {
            const val = customAttributes[def.key] ?? "";
            return (
              <div key={def.id} className="space-y-1">
                <label className="block text-xs font-semibold text-text flex items-center justify-between">
                  <span>{def.name}</span>
                  <span className="font-mono text-[9px] text-textMuted uppercase">
                    {def.type}
                  </span>
                </label>

                {def.type === "SELECT" && Array.isArray(def.options) ? (
                  <select
                    value={val}
                    onChange={(e) => handleFieldChange(def.key, e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
                  >
                    <option value="">Select {def.name}...</option>
                    {def.options.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : def.type === "BOOLEAN" ? (
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!val}
                      onChange={(e) =>
                        handleFieldChange(def.key, e.target.checked)
                      }
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-xs text-text">
                      {val ? "Yes / Enabled" : "No / Disabled"}
                    </span>
                  </label>
                ) : (
                  <input
                    type={def.type === "NUMBER" ? "number" : "text"}
                    value={val}
                    onChange={(e) => handleFieldChange(def.key, e.target.value)}
                    placeholder={`Enter ${def.name.toLowerCase()}...`}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
