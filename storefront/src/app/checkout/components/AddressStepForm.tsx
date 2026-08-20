"use client";

import React from "react";
import { MapPin, User, Mail, Phone } from "lucide-react";

interface AddressStepFormProps {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
}

export default function AddressStepForm({
  email,
  phone,
  firstName,
  lastName,
  address,
  city,
  state,
  pincode,
  onChange,
  onSubmit,
}: AddressStepFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-surface/40 p-6 border border-border/80 rounded-xl shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <MapPin size={18} className="text-gold" />
        <h3 className="font-serif font-bold text-base text-cream">
          Shipping Address & Contact
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Email */}
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase text-textMuted">
            Email Address *
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-3 text-textMuted" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="e.g. client@domain.com"
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-cream text-xs focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Contact Phone */}
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase text-textMuted">
            Phone Number *
          </label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-3 text-textMuted" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-cream text-xs font-mono focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* First Name */}
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase text-textMuted">
            First Name *
          </label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="First name"
            className="w-full px-3 py-2 bg-background border border-border rounded text-cream text-xs focus:outline-none focus:border-gold"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase text-textMuted">
            Last Name *
          </label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Last name"
            className="w-full px-3 py-2 bg-background border border-border rounded text-cream text-xs focus:outline-none focus:border-gold"
          />
        </div>

        {/* Street Address */}
        <div className="space-y-1 md:col-span-2">
          <label className="block text-xs font-mono uppercase text-textMuted">
            Street Address *
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="Flat/House No., Building, Street Name"
            className="w-full px-3 py-2 bg-background border border-border rounded text-cream text-xs focus:outline-none focus:border-gold"
          />
        </div>

        {/* City */}
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase text-textMuted">
            City / District *
          </label>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="City"
            className="w-full px-3 py-2 bg-background border border-border rounded text-cream text-xs focus:outline-none focus:border-gold"
          />
        </div>

        {/* Pincode */}
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase text-textMuted">
            Pincode *
          </label>
          <input
            type="text"
            required
            value={pincode}
            onChange={(e) => onChange("pincode", e.target.value)}
            placeholder="6-digit pincode"
            maxLength={6}
            className="w-full px-3 py-2 bg-background border border-border rounded text-cream text-xs font-mono focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-gold text-obsidian font-mono text-xs uppercase tracking-widest font-bold rounded hover:bg-gold-pale transition-all cursor-pointer shadow-md"
      >
        Continue to Shipping
      </button>
    </form>
  );
}
