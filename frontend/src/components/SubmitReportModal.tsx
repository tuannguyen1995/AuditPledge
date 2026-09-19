import React, { useState } from "react";
import { X, Send, Sparkles, AlertCircle, FileCode, CheckCircle, ShieldAlert } from "lucide-react";
import { DEMO_REPORTS, DemoReport } from "../utils/sampleData";

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bountyId: string;
  targetRepoUrl: string;
  scopeSpec: string;
  onSubmit: (bountyId: string, reportUrl: string) => Promise<void>;
  isSubmitting: boolean;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  onClose,
  bountyId,
  targetRepoUrl,
  scopeSpec,
  onSubmit,
  isSubmitting,
}) => {
  const [reportUrl, setReportUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (report: DemoReport) => {
    setReportUrl(report.url);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = reportUrl.trim();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      setError("Please provide a valid public URL (http:// or https://) accessible to the AI Jury.");
      return;
    }

    try {
      await onSubmit(bountyId, clean);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit audit report.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="bg-cyber-card border border-cyber-border rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-bg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyber-surface rounded-md text-neon-cyan border border-neon-cyan/40">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base text-white">
                Submit Vulnerability Report & PoC
              </h3>
              <p className="text-[11px] text-cyber-muted font-mono">
                Target: {bountyId} &bull; Decentralized AI Jury Consensus
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Metadata Card */}
          <div className="p-3 bg-cyber-surface border border-cyber-border rounded-lg text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-cyber-muted">Target Escrow ID:</span>
              <span className="font-bold text-neon-cyan">{bountyId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyber-muted">Repository:</span>
              <span className="font-bold text-white truncate max-w-xs">{targetRepoUrl}</span>
            </div>
            <div className="pt-1 border-t border-cyber-border text-cyber-muted text-[11px] font-sans">
              <strong className="text-white font-mono">Scope Invariants:</strong> {scopeSpec}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-neon-crimson/15 border border-neon-crimson/50 text-neon-crimson rounded-md text-xs flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Presets */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-mono text-cyber-muted mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
              <span>Test Vulnerability Report Templates:</span>
            </div>
            <div className="space-y-1.5">
              {DEMO_REPORTS.map((r) => (
                <button
                  key={r.title}
                  type="button"
                  onClick={() => handleApplyPreset(r)}
                  className="w-full px-3 py-2 bg-cyber-surface hover:bg-cyber-border border border-cyber-border hover:border-neon-cyan/50 rounded-md text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-white flex items-center space-x-2">
                      <span>{r.title}</span>
                      {r.type === "PASSING" ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/40 font-bold">
                          CRITICAL PoC (Pass Expected)
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-crimson/20 text-neon-crimson border border-neon-crimson/40 font-bold">
                          LINTER SPAM (Reject Expected)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-cyber-muted font-sans mt-0.5">
                      {r.description}
                    </div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-cyber-subtle flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Report URL input */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyber-muted mb-1 uppercase tracking-wider">
              Public Report / Reproducible PoC URL *
            </label>
            <input
              type="url"
              required
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
              placeholder="https://gist.githubusercontent.com/.../reentrancy_poc.md"
              className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded-md text-sm text-white focus:outline-none focus:border-neon-cyan font-mono text-xs"
            />
            <p className="text-[11px] text-cyber-subtle mt-1 font-sans">
              Enter a public GitHub Gist, raw markdown, or repo file containing the vulnerability writeup and reproduction steps.
            </p>
          </div>

          {/* Auditor Protection Disclaimer */}
          <div className="p-3 bg-cyber-surface border border-cyber-border rounded-md text-xs text-cyber-muted space-y-1">
            <div className="flex items-center space-x-1 font-bold text-neon-cyan font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Anti-Rugpull & Auditor Protection</span>
            </div>
            <p className="text-[11px] text-cyber-subtle leading-relaxed">
              Once your report is submitted, the Project Owner cannot cancel the bounty. The on-chain AI Jury independently renders your report via web rendering and checks against canary tokens before disbursing funds.
            </p>
          </div>

          {/* Actions */}
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
              className="px-5 py-2 bg-gradient-to-r from-neon-cyan to-neon-emerald text-cyber-bg font-mono font-bold text-xs rounded-md shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 tracking-wider"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting on-chain..." : "Submit to AI Jury"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};