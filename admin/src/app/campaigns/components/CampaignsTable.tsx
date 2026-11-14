"use client";

import React from "react";
import { Mail, MessageSquare, Rocket, Edit, Trash2 } from "lucide-react";

export interface Campaign {
  id: string;
  name: string;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  stage: "STAGE_1_DISPATCH" | "STAGE_2_EXPIRY_WARNING";
  segmentationRules: any;
  metrics: any;
  emailSubject: string | null;
  whatsappText: string | null;
  createdAt: string;
  scheduledAt?: string | null;
}

interface CampaignsTableProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
}

export default function CampaignsTable({
  campaigns,
  onEdit,
  onDelete,
  onExecute,
}: CampaignsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "SCHEDULED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "DRAFT":
        return "bg-surface2 text-textMuted border-border";
      case "COMPLETED":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }
  };

  return (
    <div className="bg-surface border border-border/80 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-background border-b border-border/60 font-mono text-[10px] uppercase text-textMuted tracking-wider">
              <th className="p-4">Campaign</th>
              <th className="p-4">Channels</th>
              <th className="p-4">Status</th>
              <th className="p-4">Metrics</th>
              <th className="p-4">Created Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-text">
            {campaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-textMuted font-mono"
                >
                  No marketing campaigns found. Create your first campaign.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-surface2/40 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-text font-serif text-sm">
                      {c.name}
                    </div>
                    <div className="text-[10px] font-mono text-textMuted uppercase mt-0.5">
                      {c.stage.replace(/_/g, " ")}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {c.emailSubject && (
                        <span
                          className="p-1.5 bg-accent/10 text-accent rounded"
                          title="Email Channel Enabled"
                        >
                          <Mail size={13} />
                        </span>
                      )}
                      {c.whatsappText && (
                        <span
                          className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded"
                          title="WhatsApp Channel Enabled"
                        >
                          <MessageSquare size={13} />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold rounded border ${getStatusBadge(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="p-4 font-mono text-[11px] text-textMuted">
                    {c.metrics?.sent
                      ? `${c.metrics.sent} Sent`
                      : "Not Dispatched"}
                  </td>

                  <td className="p-4 font-mono text-[11px] text-textMuted">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onExecute(c.id)}
                        className="p-1.5 bg-gold/15 text-gold hover:bg-gold hover:text-obsidian rounded transition-all cursor-pointer"
                        title="Execute Campaign Dispatch"
                      >
                        <Rocket size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="p-1.5 bg-surface2 text-textMuted hover:text-primary rounded transition-colors cursor-pointer"
                        title="Edit Campaign"
                      >
                        <Edit size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-colors cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
