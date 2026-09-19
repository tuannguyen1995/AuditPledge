import React, { useState } from "react";
import { X, AlertTriangle, Scale, ShieldAlert, Send } from "lucide-react";
import { AuditBountyData } from "../utils/helpers";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bounty: AuditBountyData | null;
  mode: "DISPUTE" | "APPEAL";
  onSubmitDispute: (bountyId: string, reason: string) => Promise<void>;
  onSubmitAppeal: (bountyId: string, appealUrl: string) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "DISPUTE") {
      if (!reason.trim() || reason.trim().length < 10) {
        setError("Please provide a substantive justification for disputing this verdict (min 10 characters).");
        return;
      }
      try {
        await onSubmitDispute(bounty.bounty_id, reason.trim());
        onClose();
      } catch (err: any) {
        setError(err?.message || "Failed to raise dispute.");
      }
    } else {
      if (!appealUrl.trim() || (!appealUrl.startsWith("http://") && !appealUrl.startsWith("https://"))) {
        setError("Please provide a valid public counter-evidence URL (http/https).");
        return;
      }
      try {
        await onSubmitAppeal(bounty.bounty_id, appealUrl.trim());
        onClose();
      } catch (err: any) {
        setError(err?.message || "Failed to submit appeal.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-solar-base03/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-solar-base2 border border-solar-base1 rounded max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-solar-base1 bg-solar-base3">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-solar-red" />
            <h3 className="font-mono font-bold text-base text-solar-base03">
              {mode === "DISPUTE" ? "Challenge AI Verdict (Raise Dispute)" : "Appellate Court Counter-Evidence"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-solar-base01 hover:text-solar-base03 p-1 rounded hover:bg-solar-base2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-solar-base3 border border-solar-base1 rounded text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-solar-base01">Target Escrow:</span>
              <span className="font-bold text-solar-cyan">{bounty.bounty_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-solar-base01">Current AI Verdict:</span>
              <span className="font-bold text-solar-base03">{bounty.verdict}</span>
            </div>
            <div className="text-[11px] text-solar-base00 italic pt-1 border-t border-solar-base1/40">
              "{bounty.reason}"
            </div>
          </div>

          {error && (
            <div className="p-3 bg-solar-red/15 border border-solar-red text-solar-red rounded text-xs flex items-center space-x-2 font-mono">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "DISPUTE" ? (
            <div>
              <label className="block text-xs font-mono font-bold text-solar-base02 mb-1 uppercase tracking-wider">
                Grounds for Dispute & Technical Rebuttal *
              </label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this finding is inaccurate, out-of-scope, or why the depth score was evaluated unfairly..."
                className="w-full px-3 py-2 bg-solar-base3 border border-solar-base1 rounded text-sm text-solar-base03 focus:outline-none focus:border-solar-cyan font-sans"
              />
              <p className="text-[11px] text-solar-base00 mt-1">
                Disputing halts automated disbursement and moves the escrow to the Appellate Security Court.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono font-bold text-solar-base02 mb-1 uppercase tracking-wider">
                Appellate Counter-Evidence / PoC URL *
              </label>
              <input
                type="url"
                required
                value={appealUrl}
                onChange={(e) => setAppealUrl(e.target.value)}
                placeholder="https://gist.githubusercontent.com/.../counter_proof.md"
                className="w-full px-3 py-2 bg-solar-base3 border border-solar-base1 rounded text-sm text-solar-base03 focus:outline-none focus:border-solar-cyan font-mono"
              />
              <p className="text-[11px] text-solar-base00 mt-1">
                Must be a publicly accessible URL containing supplementary reproduction scripts or logs.
              </p>
            </div>
          )}

          <div className="p-3 bg-solar-base3 border border-solar-base1 rounded text-xs text-solar-base01 space-y-1">
            <div className="flex items-center space-x-1 font-bold text-solar-base02 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-solar-red" />
              <span>Due Process Guarantee</span>
            </div>
            <p className="text-[11px] text-solar-base00 leading-relaxed">
              Both the Project Owner and Security Auditor possess equal rights to challenge assessments. GenLayer's secondary appellate consensus reviews counter-evidence without human bias.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-solar-base1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-solar-base3 hover:bg-solar-base1/30 text-solar-base01 rounded font-mono text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-solar-red hover:bg-solar-red/90 text-solar-base3 font-mono font-bold text-xs rounded border border-solar-red transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-solar-base3 border-t-transparent rounded-full animate-spin"></span>
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