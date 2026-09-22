import React from "react";
import { X, Scale, ExternalLink, ShieldCheck, ShieldAlert, CheckCircle2, Cpu, Lock } from "lucide-react";
import { AuditBountyData, formatGEN, shortenAddress, getVerdictDisplay } from "../utils/helpers";

interface JuryInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bounty: AuditBountyData | null;
}

export const JuryInspectorModal: React.FC<JuryInspectorModalProps> = ({
  isOpen,
  onClose,
  bounty,
}) => {
  if (!isOpen || !bounty) return null;

  const verdictDisplay = getVerdictDisplay(bounty.verdict);
  const isPassed = bounty.verdict.toUpperCase() === "AUDIT_PASSED";
  const isRejected = bounty.verdict.toUpperCase() === "AUDIT_REJECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="bg-cyber-card border border-cyber-border rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-bg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyber-surface rounded-md text-neon-cyan border border-neon-cyan/40">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base text-white flex items-center gap-2">
                <span>AI Consensus War Room Dossier</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
                  CONFIRMED
                </span>
              </h3>
              <p className="text-[11px] text-cyber-muted font-mono">
                Bounty ID: {bounty.bounty_id} &bull; GenLayer Decentralized Subjective Consensus
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

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Verdict Banner */}
          <div
            className={`p-4 rounded-lg border flex items-center justify-between ${
              isPassed
                ? "bg-neon-emerald/10 border-neon-emerald/50 text-neon-emerald"
                : isRejected
                ? "bg-neon-crimson/10 border-neon-crimson/50 text-neon-crimson"
                : "bg-neon-amber/10 border-neon-amber/50 text-neon-amber"
            }`}
          >
            <div className="flex items-center space-x-3">
              {isPassed ? (
                <ShieldCheck className="w-8 h-8 flex-shrink-0" />
              ) : isRejected ? (
                <ShieldAlert className="w-8 h-8 flex-shrink-0" />
              ) : (
                <Scale className="w-8 h-8 flex-shrink-0" />
              )}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider font-semibold opacity-80">
                  Consensus Verdict
                </div>
                <div className="text-base font-mono font-bold">
                  {verdictDisplay.label}
                </div>
                <div className="text-xs font-mono opacity-90 mt-0.5">
                  Severity: {verdictDisplay.severityTag}
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-2xl font-bold">{bounty.depth_score}/100</div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">Depth Score</div>
            </div>
          </div>

          {/* Simulated Multi-Node Consensus Telemetry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyber-muted">
              <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-white">
                <Cpu className="w-3.5 h-3.5 text-neon-cyan" />
                <span>Multi-Validator Consensus Matrix</span>
              </span>
              <span className="text-neon-emerald flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-emerald animate-pulse"></span>
                <span>Canary V1 Validated</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-cyber-surface/70 p-2.5 rounded border border-cyber-border">
                <div className="text-cyber-subtle text-[10px] uppercase">Node 01: Invariant AST</div>
                <div className="font-bold text-white mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neon-emerald" />
                  <span>Control Flow OK</span>
                </div>
              </div>
              <div className="bg-cyber-surface/70 p-2.5 rounded border border-cyber-border">
                <div className="text-cyber-subtle text-[10px] uppercase">Node 02: PoC Reproduction</div>
                <div className="font-bold text-white mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neon-emerald" />
                  <span>Sandboxed Attack</span>
                </div>
              </div>
              <div className="bg-cyber-surface/70 p-2.5 rounded border border-cyber-border">
                <div className="text-cyber-subtle text-[10px] uppercase">Node 03: Canary Defense</div>
                <div className="font-bold text-white mt-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-neon-cyan" />
                  <span>No Injection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Qualitative Assessment Reason */}
          <div className="space-y-1.5">
            <span className="font-mono font-bold text-xs text-cyber-muted uppercase tracking-wider block">
              Chief Justice Qualitative Assessment:
            </span>
            <div className="bg-cyber-surface p-3.5 rounded-lg border border-cyber-border text-sm text-cyber-text font-sans leading-relaxed">
              "{bounty.reason}"
            </div>
          </div>

          {/* Escrow & Repository Metadata Table */}
          <div className="bg-cyber-surface/40 rounded-lg border border-cyber-border divide-y divide-cyber-border text-xs font-mono">
            <div className="flex justify-between p-2.5">
              <span className="text-cyber-muted">Escrow Amount:</span>
              <span className="font-bold text-neon-cyan">{formatGEN(bounty.escrow_amount)}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-cyber-muted">Settlement Allocation:</span>
              <span className="font-bold text-white">{verdictDisplay.payoutRatio}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-cyber-muted">Auditor Address:</span>
              <span className="font-bold text-white">{shortenAddress(bounty.auditor, 6)}</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-cyber-muted">Target Codebase:</span>
              <a
                href={bounty.target_repo_url}
                target="_blank"
                rel="noreferrer"
                className="text-neon-cyan hover:underline flex items-center space-x-1"
              >
                <span className="truncate max-w-xs">{bounty.target_repo_url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            {bounty.commit_hash && (
              <div className="flex justify-between p-2.5">
                <span className="text-cyber-muted">Code Revision (Commit SHA):</span>
                <span className="font-mono text-neon-emerald font-bold">{bounty.commit_hash}</span>
              </div>
            )}
            {bounty.code_url && (
              <div className="flex justify-between p-2.5">
                <span className="text-cyber-muted">Inspected Source Code:</span>
                <a
                  href={bounty.code_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neon-cyan hover:underline flex items-center space-x-1"
                >
                  <span className="truncate max-w-xs">{bounty.code_url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}
            {bounty.report_url && (
              <div className="flex justify-between p-2.5">
                <span className="text-cyber-muted">Audit Report & PoC:</span>
                <a
                  href={bounty.report_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neon-cyan hover:underline flex items-center space-x-1"
                >
                  <span>View Gist PoC</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Footer Close */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-cyber-surface hover:bg-cyber-border text-white rounded-md font-mono text-xs font-bold transition-colors border border-cyber-border"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};