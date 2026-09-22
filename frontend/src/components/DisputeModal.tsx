import React, { useState } from "react";
import { X, AlertTriangle, Scale, ShieldAlert, Send, Coins } from "lucide-react";
import { AuditBountyData, formatGEN } from "../utils/helpers";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bounty: AuditBountyData | null;
  mode: "DISPUTE" | "APPEAL";
  onSubmitDispute: (bountyId: string, reason: string, appealUrl: string, bondWei: bigint) => Promise<void>;
  onSubmitAppeal: (bountyId: string) => Promise<void>;
  isSubmitting: boolean;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  bounty,
  mode,
  onSubmitDispute,
  onSubmitAppeal,
  isSubmitting,
}) => {
  const [reason, setReason] = useState("");
  const [appealUrl, setAppealUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !bounty) return null;

  const isOwnerDispute = bounty.status === 2; // Provisional pass challenge
  const isAuditorDispute = bounty.status === 3; // Provisional reject challenge

  // Calculate 10% anti-griefing dispute bond (min 1 wei)
  const escrowWei = BigInt(bounty.escrow_amount || "0");
  const calculatedBond = escrowWei / BigInt(10);
  const minBondWei = calculatedBond > BigInt(0) ? calculatedBond : BigInt(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "DISPUTE") {
      if (!reason.trim() || reason.trim().length < 5) {
        setError("Please provide a substantive technical justification for disputing this verdict (min 5 characters).");
        return;
      }
      if (!appealUrl.trim() || (!appealUrl.startsWith("http://") && !appealUrl.startsWith("https://"))) {
        setError("Please provide a valid public counter-evidence URL (http/https).");
        return;
      }
      try {
        await onSubmitDispute(bounty.bounty_id, reason.trim(), appealUrl.trim(), minBondWei);
        onClose();
      } catch (err: any) {
        setError(err?.message || "Failed to raise dispute.");
      }
    } else {
      try {
        await onSubmitAppeal(bounty.bounty_id);
        onClose();
      } catch (err: any) {
        setError(err?.message || "Failed to trigger appellate adjudication.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="bg-cyber-card border border-cyber-border rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-bg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyber-surface rounded-md text-neon-crimson border border-neon-crimson/40">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base text-white">
                {mode === "DISPUTE"
                  ? isOwnerDispute
                    ? "Project Owner Challenge (Dispute Pass)"
                    : isAuditorDispute
                    ? "Security Auditor Challenge (Dispute Reject)"
                    : "Challenge AI Verdict (Dispute)"
                  : "Appellate Tribunal Counter-Evidence"}
              </h3>
              <p className="text-[11px] text-cyber-muted font-mono">
                Bounty: {bounty.bounty_id} &bull; Symmetrical Bilateral Protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-cyber-muted hover:text-white p-1 rounded-md hover:bg-cyber-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-cyber-surface border border-cyber-border rounded-lg text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-cyber-muted">Target Escrow:</span>
              <span className="font-bold text-neon-cyan">{bounty.bounty_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyber-muted">Provisional Verdict:</span>
              <span className="font-bold text-white">{bounty.verdict}</span>
            </div>
            <div className="text-[11px] text-cyber-subtle italic pt-1 border-t border-cyber-border">
              "{bounty.reason}"
            </div>
          </div>

          {error && (
            <div className="p-3 bg-neon-crimson/15 border border-neon-crimson/50 text-neon-crimson rounded-md text-xs flex items-center space-x-2 font-mono">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "DISPUTE" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold text-cyber-muted mb-1 uppercase tracking-wider">
                  Technical Rebuttal & Dispute Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detail why this verdict is mathematically unfeasible, out of scope, or why the depth score was evaluated unfairly..."
                  className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded-md text-sm text-white focus:outline-none focus:border-neon-crimson font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-cyber-muted mb-1 uppercase tracking-wider">
                  Appellate Counter-Evidence & Proof URL *
                </label>
                <input
                  type="url"
                  required
                  value={appealUrl}
                  onChange={(e) => setAppealUrl(e.target.value)}
                  placeholder="https://gist.githubusercontent.com/.../counter_proof.md"
                  className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded-md text-xs text-white focus:outline-none focus:border-neon-crimson font-mono"
                />
                <p className="text-[10px] text-cyber-subtle mt-0.5">
                  Direct public link to executable reproduction traces, bound to this dispute.
                </p>
              </div>

              {/* 10% Anti-Griefing Bond Notice */}
              <div className="p-3 bg-neon-amber/10 border border-neon-amber/40 rounded-lg flex items-start space-x-2.5">
                <Coins className="w-5 h-5 text-neon-amber flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-white">Required Anti-Griefing Bond:</span>
                    <span className="font-mono font-bold text-neon-amber bg-neon-amber/20 px-2 py-0.5 rounded">
                      {formatGEN(minBondWei)} (10%)
                    </span>
                  </div>
                  <p className="text-[11px] text-cyber-muted leading-relaxed">
                    Raising a dispute requires a 10% security bond deposit.
                    <span className="text-neon-emerald font-semibold"> If your dispute is upheld, 100% of this bond is refunded to you.</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-cyber-surface border border-cyber-border rounded-lg space-y-2 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-cyber-muted">Dispute Initiator:</span>
                  <span className="font-bold text-neon-amber">{bounty.dispute_initiator || "Appellant"}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-cyber-muted">Staked Bond:</span>
                  <span className="font-bold text-white">{formatGEN(bounty.dispute_bond || "0")}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-cyber-muted">Counter-Evidence URL:</span>
                  <span className="font-bold text-neon-cyan truncate max-w-[240px]">{bounty.appeal_url || "Registered on-chain"}</span>
                </div>
              </div>
              <p className="text-xs text-cyber-muted">
                Triggering the On-Chain Appellate Security Court will cause GenLayer validators to render the target code revision, original report, and counter-evidence to reach a final, binding consensus verdict.
              </p>
            </div>
          )}

          <div className="p-3 bg-cyber-surface border border-cyber-border rounded-md text-xs text-cyber-muted space-y-1">
            <div className="flex items-center space-x-1 font-bold text-neon-crimson font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Symmetrical Due Process Guarantee</span>
            </div>
            <p className="text-[11px] text-cyber-subtle leading-relaxed">
              Both the Project Owner and Security Auditor possess equal rights to challenge assessments during the 20-block cooling-off window. GenLayer's secondary consensus evaluates evidence impartially.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyber-surface hover:bg-cyber-border text-cyber-muted rounded-md font-mono text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-neon-crimson hover:bg-neon-crimson/90 text-white font-mono font-bold text-xs rounded-md shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Transacting on-chain...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{mode === "DISPUTE" ? "Confirm Dispute Challenge" : "Submit Appellate Counter-Evidence"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};