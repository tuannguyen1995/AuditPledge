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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-solar-base03/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-solar-base2 border border-solar-base1 rounded max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-solar-base1 bg-solar-base3">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-solar-cyan" />
            <h3 className="font-mono font-bold text-base text-solar-base03">
              Lock Audit Escrow Bounty
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-solar-base01 hover:text-solar-base03 p-1 rounded hover:bg-solar-base2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Presets Bar */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-solar-base01 font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-solar-yellow" />
              <span>Fast Demo Presets (Click to autofill):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 bg-solar-base3 hover:bg-solar-cyan/15 hover:border-solar-cyan border border-solar-base1 rounded text-xs font-mono text-solar-base02 transition-all"
                >
                  {preset.name} ({preset.amount} GEN)
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-solar-red/15 border border-solar-red text-solar-red rounded text-xs flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Repo URL */}
          <div>
            <label className="block text-xs font-mono font-bold text-solar-base02 mb-1 uppercase tracking-wider">
              Target Codebase / Repository URL *
            </label>
            <input
              type="url"
              required
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/protocol/smart-contracts"
              className="w-full px-3 py-2 bg-solar-base3 border border-solar-base1 rounded text-sm text-solar-base03 focus:outline-none focus:border-solar-cyan font-mono"
            />
          </div>

          {/* Audit Scope & Invariants */}
          <div>
            <label className="block text-xs font-mono font-bold text-solar-base02 mb-1 uppercase tracking-wider">
              Audit Scope & Invariants *
            </label>
            <textarea
              required
              rows={3}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Specify critical invariants to evaluate (e.g., Reentrancy resistance, access controls, price manipulation, solvency)..."
              className="w-full px-3 py-2 bg-solar-base3 border border-solar-base1 rounded text-sm text-solar-base03 focus:outline-none focus:border-solar-cyan font-sans"
            />
            <p className="text-[11px] text-solar-base00 mt-1">
              GenLayer AI validators will compare submitted reports against these exact specifications.
            </p>
          </div>

          {/* Amount & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-solar-base02 mb-1 uppercase tracking-wider">
                Escrow Bounty (GEN) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-solar-base3 border border-solar-base1 rounded text-sm text-solar-base03 focus:outline-none focus:border-solar-cyan font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-solar-cyan">
                  GEN
                </span>
              </div>
              <p className="text-[11px] text-solar-base00 mt-1">
                Locked securely in contract on Studionet.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-solar-base02 mb-1 uppercase tracking-wider">
                Expiration (Blocks)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-solar-base3 border border-solar-base1 rounded text-sm text-solar-base03 focus:outline-none focus:border-solar-cyan font-mono"
              />
              <p className="text-[11px] text-solar-base00 mt-1">
                Owner can reclaim escrow if no submission after this duration.
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-solar-base3 border border-solar-base1 rounded text-xs text-solar-base01 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-solar-base02 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-solar-cyan" />
              <span>Decentralized Escrow Guarantee</span>
            </div>
            <p className="text-[11px] text-solar-base00 leading-relaxed">
              If an auditor submits a report, the AI Jury will verify that technical depth &ge; 70 before disbursing funds. If the report fails or is rejected, 100% of the bounty is refunded to your wallet.
            </p>
          </div>

          {/* Modal Footer */}
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
              className="px-5 py-2 bg-solar-cyan hover:bg-solar-cyan/90 text-solar-base3 font-mono font-bold text-xs rounded border border-solar-cyan transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-solar-base3 border-t-transparent rounded-full animate-spin"></span>
                  <span>Locking Bounty on Chain...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Escrow ({amount} GEN)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};