"use client";

import React, { useState } from "react";
import { Truck, X, Package, ShieldCheck } from "lucide-react";

interface EasyShipStudioModalProps {
  orderId: string;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (details: {
    courier: string;
    length: number;
    width: number;
    height: number;
    weight: number;
  }) => void;
}

export default function EasyShipStudioModal({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onDispatch,
}: EasyShipStudioModalProps) {
  const [courier, setCourier] = useState("Shiprocket Express");
  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [weight, setWeight] = useState(2.5);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatch({ courier, length, width, height, weight });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-textMuted hover:text-text p-1 rounded-md"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Truck size={20} className="text-gold" />
          <div>
            <h3 className="font-serif font-bold text-base text-text">
              EasyShip Fulfillment Studio
            </h3>
            <p className="text-xs font-mono text-textMuted">
              Order #{orderNumber}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text">
              Courier Partner
            </label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
            >
              <option value="Shiprocket Express">Shiprocket Air Express</option>
              <option value="Delhivery Surface">
                Delhivery Heavy Freight Surface
              </option>
              <option value="Bluedart Express">
                Bluedart Priority Express
              </option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-textMuted">
                Length (cm)
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-textMuted">
                Width (cm)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-textMuted">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text">
              Dead Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
            />
          </div>

          <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg text-xs text-gold flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0" />
            <span>
              Fragile artwork shipping insurance enabled automatically.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-textMuted font-mono text-xs uppercase rounded hover:bg-surface2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gold text-obsidian font-mono text-xs uppercase tracking-wider font-bold rounded hover:bg-gold-pale transition-all shadow-md"
            >
              Generate AWB & Label
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
