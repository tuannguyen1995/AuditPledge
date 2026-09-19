import React from "react";
import { ExternalLink, Scale, Send, RotateCcw, Award, Lock, FileCode, CheckCircle2, AlertTriangle, Clock, ShieldAlert, Bug, Terminal } from "lucide-react";
import { AuditBountyData, formatGEN, shortenAddress, getStatusBadge, getVerdictDisplay } from "../utils/helpers";

interface BountyCardProps {
  bounty: AuditBountyData;
  account: string | null;
  isAdmin: boolean;
  onOpenSubmit: (bounty: AuditBountyData) => void;
  onAdjudicate: (bountyId: string) => Promise<void>;
  onOpenDispute: (bounty: AuditBountyData) => void;
  onFinalizeSettlement: (bountyId: string) => Promise<void>;
  onOpenAppeal: (bounty: AuditBountyData) => void;
  onAdminArbitrate: (bountyId: string, verdict: string) => Promise<void>;
  onReclaim: (bountyId: string) => Promise<void>;
  onInspect: (bounty: AuditBountyData) => void;
  isActionLoading: boolean;
  activeActionBountyId: string | null;
}

export const BountyCard: React.FC<BountyCardProps> = ({
  bounty,
  account,
  isAdmin,
  onOpenSubmit,
  onAdjudicate,
  onOpenDispute,
  onFinalizeSettlement,
  onOpenAppeal,
  onAdminArbitrate,
  onReclaim,
  onInspect,
  isActionLoading,
  activeActionBountyId,
}) => {
  const statusBadge = getStatusBadge(bounty.status);
  const verdictDisplay = getVerdictDisplay(bounty.verdict);
  const isOwner = Boolean(account && account.toLowerCase() === bounty.project_owner.toLowerCase());
  const isAuditor = Boolean(account && account.toLowerCase() === bounty.auditor.toLowerCase());
  const isProcessing = isActionLoading && activeActionBountyId === bounty.bounty_id;

  return (
    <div className="bg-cyber-card border border-cyber-border hover:border-neon-cyan/40 rounded-lg transition-all p-5 shadow-lg space-y-4 font-sans relative overflow-hidden group">
      {/* Decorative top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-cyan/40 via-neon-emerald/30 to-transparent"></div>

      {/* Top Header: Bounty ID, Escrow Badge, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyber-border pb-3">
        <div className="flex items-center space-x-2 font-mono">
          <div className="p-1 bg-cyber-surface rounded border border-cyber-border text-neon-cyan">
            <Bug className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm text-white tracking-wider">
            {bounty.bounty_id}
          </span>
          <span className="text-[11px] text-cyber-subtle">
            Owner: {shortenAddress(bounty.project_owner, 3)}
          </span>
          {isOwner && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/15 text-neon-cyan font-bold border border-neon-cyan/40">
              YOU (OWNER)
            </span>
          )}
          {isAuditor && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-amber/15 text-neon-amber font-bold border border-neon-amber/40">
              YOU (AUDITOR)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Escrow Value Badge */}
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-cyber-surface rounded border border-neon-cyan/30 text-xs font-mono font-bold text-neon-cyan">
            <Lock className="w-3 h-3 text-neon-cyan" />
            <span>{formatGEN(bounty.escrow_amount)}</span>
          </div>

          {/* Status Badge */}
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
          >
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Target Repo & Invariants */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono font-bold text-cyber-muted uppercase tracking-wider text-[11px]">
            Target Repository:
          </span>
          <a
            href={bounty.target_repo_url}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-neon-cyan hover:underline flex items-center space-x-1 truncate max-w-xs"
          >
            <span className="truncate">{bounty.target_repo_url}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>

        <div className="bg-cyber-surface/70 p-3 rounded border border-cyber-border text-xs">
          <span className="font-mono font-bold text-cyber-muted block mb-1 text-[11px] uppercase tracking-wider">
            Critical Invariants & Threat Model:
          </span>
          <p className="text-cyber-text line-clamp-2 leading-relaxed font-sans text-[12px]">
            {bounty.scope_spec}
          </p>
        </div>
      </div>

      {/* Status 0: OPEN */}
      {bounty.status === 0 && (
        <div className="text-xs font-mono text-cyber-muted bg-cyber-surface/40 p-2.5 rounded border border-cyber-border flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Terminal className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Awaiting Whitehat vulnerability PoC</span>
          </span>
          <span className="text-[11px] text-cyber-subtle">
            Expires block #{bounty.expires_at_block}
          </span>
        </div>
      )}

      {/* Status 1: IN_AUDIT */}
      {bounty.status === 1 && (
        <div className="space-y-2 text-xs font-mono">
          <div className="bg-neon-amber/10 p-2.5 rounded border border-neon-amber/30 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-neon-amber">
              <FileCode className="w-4 h-4" />
              <span className="font-bold">Audit PoC submitted & ready for AI Jury</span>
            </div>
            {bounty.report_url && (
              <a
                href={bounty.report_url}
                target="_blank"
                rel="noreferrer"
                className="text-neon-cyan hover:underline flex items-center space-x-1"
              >
                <span>View PoC Gist</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="text-[11px] text-cyber-subtle flex justify-between">
            <span>Auditor: {shortenAddress(bounty.auditor, 4)}</span>
            <span>Started block #{bounty.audit_started_block}</span>
          </div>
        </div>
      )}

      {/* Status 2: AWAITING_PAYOUT (Cooling-off Challenge Window for Project Owner) */}
      {bounty.status === 2 && (
        <div className="p-3 bg-neon-amber/10 rounded border border-neon-amber/40 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-neon-amber">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="font-bold">20-Block Cooling-Off: Provisional Pass</span>
            </div>
            <span className="text-[11px] font-bold">Matures at block: #{bounty.payout_ready_at_block}</span>
          </div>

          <div className="flex items-center justify-between bg-cyber-surface p-2 rounded text-[11px] border border-cyber-border">
            <span className="text-cyber-muted">Provisional Verdict:</span>
            <span className={`font-bold ${verdictDisplay.text}`}>{verdictDisplay.label}</span>
          </div>

          <p className="font-sans text-[11px] text-cyber-muted">
            <strong className="text-white">Project Owner Protection:</strong> The Owner may inspect findings and challenge this approval if the exploit is unverified or out of scope.
          </p>
        </div>
      )}

      {/* Status 3: AWAITING_REFUND (Cooling-off Challenge Window for Security Auditor) */}
      {bounty.status === 3 && (
        <div className="p-3 bg-neon-amber/10 rounded border border-neon-amber/40 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-neon-amber">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="font-bold">20-Block Cooling-Off: Provisional Rejection</span>
            </div>
            <span className="text-[11px] font-bold">Matures at block: #{bounty.payout_ready_at_block}</span>
          </div>

          <div className="flex items-center justify-between bg-cyber-surface p-2 rounded text-[11px] border border-cyber-border">
            <span className="text-cyber-muted">Provisional Verdict:</span>
            <span className={`font-bold ${verdictDisplay.text}`}>{verdictDisplay.label}</span>
          </div>

          <p className="font-sans text-[11px] text-cyber-muted">
            <strong className="text-white">Security Auditor Protection:</strong> The Auditor may challenge this rejection if the AI jury overlooked reproducible vulnerability depth.
          </p>
        </div>
      )}

      {/* Status 4: DISPUTED (Appellate Court Phase) */}
      {bounty.status === 4 && (
        <div className="p-3 bg-neon-crimson/10 rounded border border-neon-crimson/40 space-y-2 font-mono text-xs">
          <div className="flex items-center space-x-1.5 text-neon-crimson font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Escrow Under Active Dispute (Appellate Security Court)</span>
          </div>
          <div className="bg-cyber-surface p-2 rounded text-[11px] text-white border border-cyber-border">
            <span className="font-bold text-neon-crimson block mb-0.5">Dispute Justification:</span>
            <p className="font-sans italic text-cyber-muted">{bounty.dispute_reason || bounty.reason}</p>
          </div>
          {bounty.appeal_url && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-cyber-muted">Appellate Counter-Evidence:</span>
              <a href={bounty.appeal_url} target="_blank" rel="noreferrer" className="text-neon-cyan underline flex items-center space-x-1">
                <span>View Counter-Proof</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          <p className="font-sans text-[11px] text-cyber-subtle">
            Funds remain locked in escrow. Counter-evidence will be adjudicated by secondary consensus.
          </p>
        </div>
      )}

      {/* Status 5 & 6: Settled (AUDIT_APPROVED or AUDIT_REJECTED) */}
      {(bounty.status === 5 || bounty.status === 6) && (
        <div className="p-3 bg-cyber-surface rounded border border-cyber-border space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-neon-cyan" />
              <span className="text-cyber-muted">Settled Verdict:</span>
              <span className={`font-bold ${verdictDisplay.text}`}>
                {verdictDisplay.label}
              </span>
            </div>

            <div className="flex items-center space-x-1 text-neon-amber font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Depth: {bounty.depth_score}/100</span>
            </div>
          </div>

          <div className="text-[11px] text-cyber-muted flex justify-between border-t border-cyber-border pt-1.5">
            <span>Settlement Disbursed:</span>
            <span className="font-bold text-white">{verdictDisplay.payoutRatio}</span>
          </div>
        </div>
      )}

      {/* Status 7: CANCELLED */}
      {bounty.status === 7 && (
        <div className="p-2.5 bg-cyber-surface rounded border border-cyber-border text-xs font-mono text-cyber-subtle">
          Bounty cancelled and escrow reclaimed by project owner.
        </div>
      )}

      {/* Action Buttons Footer */}
      <div className="pt-2 border-t border-cyber-border flex flex-wrap items-center justify-between gap-2">
        <div>
          {/* Owner Reclaim Action */}
          {isOwner && (bounty.status === 0 || bounty.status === 1) && (
            <button
              onClick={() => onReclaim(bounty.bounty_id)}
              disabled={isProcessing}
              className="text-[11px] font-mono text-neon-crimson hover:text-neon-crimson/80 flex items-center space-x-1 hover:underline disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reclaim Escrow</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Status 0: Submit Report (Auditor only) */}
          {bounty.status === 0 && (
            <button
              onClick={() => onOpenSubmit(bounty)}
              disabled={isProcessing || isOwner}
              title={isOwner ? "Owner cannot submit to own bounty" : "Submit report and PoC"}
              className="px-3.5 py-1.5 bg-cyber-surface hover:bg-cyber-border text-white rounded font-mono text-xs font-bold transition-all flex items-center space-x-1.5 border border-neon-cyan/40 shadow-sm active:scale-95 disabled:opacity-40"
            >
              <Send className="w-3 h-3 text-neon-cyan" />
              <span>Submit Findings & PoC</span>
            </button>
          )}

          {/* Status 1: Trigger AI Adjudication */}
          {bounty.status === 1 && (
            <button
              onClick={() => onAdjudicate(bounty.bounty_id)}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-gradient-to-r from-neon-cyan to-neon-emerald hover:opacity-95 text-cyber-bg rounded font-mono text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md active:scale-95 disabled:opacity-50 tracking-wide"
            >
              {isProcessing ? (
                <>
                  <span className="w-3 h-3 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin"></span>
                  <span>AI Jury Consensus...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Adjudicate Audit (AI Jury)</span>
                </>
              )}
            </button>
          )}

          {/* Status 2: AWAITING_PAYOUT -> Project Owner can Dispute, or Anyone can Finalize */}
          {bounty.status === 2 && (
            <>
              {isOwner && (
                <button
                  onClick={() => onOpenDispute(bounty)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-neon-crimson/20 hover:bg-neon-crimson/30 text-neon-crimson rounded font-mono text-xs font-bold transition-colors border border-neon-crimson flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Challenge Approval (Owner Dispute)</span>
                </button>
              )}
              <button
                onClick={() => onFinalizeSettlement(bounty.bounty_id)}
                disabled={isProcessing}
                className="px-3.5 py-1.5 bg-neon-emerald hover:bg-neon-emerald/90 text-cyber-bg rounded font-mono text-xs font-bold transition-all shadow-md flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Finalize Settlement</span>
              </button>
            </>
          )}

          {/* Status 3: AWAITING_REFUND -> Auditor can Dispute, or Anyone can Finalize Refund */}
          {bounty.status === 3 && (
            <>
              {isAuditor && (
                <button
                  onClick={() => onOpenDispute(bounty)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-neon-crimson/20 hover:bg-neon-crimson/30 text-neon-crimson rounded font-mono text-xs font-bold transition-colors border border-neon-crimson flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Challenge Rejection (Auditor Dispute)</span>
                </button>
              )}
              <button
                onClick={() => onFinalizeSettlement(bounty.bounty_id)}
                disabled={isProcessing}
                className="px-3.5 py-1.5 bg-neon-emerald hover:bg-neon-emerald/90 text-cyber-bg rounded font-mono text-xs font-bold transition-all shadow-md flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Finalize Refund to Owner</span>
              </button>
            </>
          )}

          {/* Status 4: DISPUTED -> Appellate counter-evidence or Admin resolution */}
          {bounty.status === 4 && (
            <>
              <button
                onClick={() => onOpenAppeal(bounty)}
                disabled={isProcessing}
                className="px-3.5 py-1.5 bg-neon-crimson hover:bg-neon-crimson/90 text-white rounded font-mono text-xs font-bold transition-colors flex items-center space-x-1 shadow-md"
              >
                <Scale className="w-3 h-3" />
                <span>Submit Appellate Proof</span>
              </button>

              {isAdmin && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onAdminArbitrate(bounty.bounty_id, "AUDIT_PASSED")}
                    className="px-2 py-1 bg-neon-emerald/20 text-neon-emerald text-[10px] font-bold rounded border border-neon-emerald/40"
                  >
                    Admin: Approve
                  </button>
                  <button
                    onClick={() => onAdminArbitrate(bounty.bounty_id, "AUDIT_REJECTED")}
                    className="px-2 py-1 bg-neon-crimson/20 text-neon-crimson text-[10px] font-bold rounded border border-neon-crimson/40"
                  >
                    Admin: Reject
                  </button>
                </div>
              )}
            </>
          )}

          {/* Status 5 & 6: Settled -> Inspect Dossier */}
          {(bounty.status === 5 || bounty.status === 6) && (
            <button
              onClick={() => onInspect(bounty)}
              className="px-3.5 py-1.5 bg-cyber-surface hover:bg-cyber-border text-neon-cyan rounded font-mono text-xs font-semibold transition-colors flex items-center space-x-1.5 border border-neon-cyan/30"
            >
              <CheckCircle2 className="w-3 h-3 text-neon-cyan" />
              <span>Inspect AI Dossier</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};