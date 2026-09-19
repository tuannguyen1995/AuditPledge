import React, { useState } from "react";
import { X, Lock, Sparkles, AlertCircle, ShieldAlert } from "lucide-react";
import { DEMO_PRESETS, DemoPreset } from "../utils/sampleData";

interface CreateBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (repoUrl: string, scope: string, amountGen: string, durationBlocks: number) => Promise<void>;
  isSubmitting: boolean;
}

export const CreateBountyModal: React.FC<CreateBountyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [scope, setScope] = useState("");
  const [amount, setAmount] = useState("1.0");
  const [duration, setDuration] = useState(6000);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: DemoPreset) => {
    setRepoUrl(preset.repoUrl);
    setScope(preset.scope);
    setAmount(preset.amount);
    setDuration(preset.duration);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!repoUrl.trim() || !repoUrl.startsWith("http")) {
      setError("Please provide a valid public repository URL (http/https).");
      return;
    }
    if (!scope.trim() || scope.trim().length < 10) {
      setError("Please specify clear audit requirements and security invariants (at least 10 chars).");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Escrow bounty must be greater than 0 GEN.");
      return;
    }

    try {
      await onSubmit(repoUrl.trim(), scope.trim(), amount.trim(), Number(duration) || 6000);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create audit escrow.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="bg-cyber-card border border-cyber-border rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-bg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyber-surface rounded-md text-neon-cyan border border-neon-cyan/40">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base text-white">
                Deploy Audit Escrow Bounty
              </h3>
              <p className="text-[11px] text-cyber-muted font-mono">
                Lock GEN in autonomous custody &bull; Define threat models
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-neon-crimson/15 border border-neon-crimson/50 text-neon-crimson rounded-md text-xs flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-mono text-cyber-muted mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
              <span>Quick Security Presets:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1.5 bg-cyber-surface hover:bg-cyber-border border border-cyber-border hover:border-neon-cyan/50 rounded-md text-left transition-all"
                >
                  <div className="text-[11px] font-mono font-bold text-white truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] font-mono text-neon-cyan">
                    {p.amount} GEN
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Repo URL */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyber-muted mb-1 uppercase tracking-wider">
              Target Codebase / Repository URL *
            </label>
            <input
              type="url"
              required
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/defi-protocol/vault-core"
              className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded-md text-sm text-white focus:outline-none focus:border-neon-cyan font-mono text-xs"
            />
            <p className="text-[11px] text-cyber-subtle mt-1 font-sans">
              Must be publicly accessible. GenLayer validators fetch and verify code via on-chain web rendering.
            </p>
          </div>

          {/* Scope & Invariants */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyber-muted mb-1 uppercase tracking-wider">
              Required Invariants & Critical Scope *
            </label>
            <textarea
              required
              rows={3}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="List critical invariants: Solvency under flash loans, access control on admin endpoints, oracle staleness checks..."
              className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded-md text-sm text-white focus:outline-none focus:border-neon-cyan font-sans"
            />
          </div>

          {/* Escrow Amount & Duration Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-cyber-muted mb-1 uppercase tracking-wider">
                Bounty Pool (GEN) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1.0"
                  className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded-md text-sm text-white focus:outline-none focus:border-neon-cyan font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-neon-cyan">
                  GEN
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-cyber-muted mb-1 uppercase tracking-wider">
                Expiry (Blocks)
              </label>
              <input
                type="number"
                min="100"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="6000"
                className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded-md text-sm text-white focus:outline-none focus:border-neon-cyan font-mono"
              />
            </div>
          </div>

          {/* Graduated Payout Notice */}
          <div className="p-3 bg-cyber-surface border border-cyber-border rounded-md text-xs text-cyber-muted space-y-1">
            <div className="flex items-center space-x-1 font-bold text-neon-emerald font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Graduated Settlement & Cooling-Off Protection</span>
            </div>
            <p className="text-[11px] text-cyber-subtle leading-relaxed">
              If an auditor reports a valid vulnerability, payouts are graduated: Critical (100%), Medium (40% payout / 60% refund), or 0% refund on spam. The 20-block cooling-off window guarantees your right to challenge false findings.
            </p>
          </div>

          {/* Footer Actions */}
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
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Locking on-chain..." : "Lock Escrow & Deploy"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};