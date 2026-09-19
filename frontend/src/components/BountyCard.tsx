import React from "react";
import { ExternalLink, Scale, Send, RotateCcw, Award, Lock, FileCode, CheckCircle2, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
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
  const isParty = isOwner || isAuditor;
  const isProcessing = isActionLoading && activeActionBountyId === bounty.bounty_id;

  return (
    <div className="bg-solar-base2 border border-solar-base1 rounded hover:border-solar-base01 transition-all p-5 shadow-sm space-y-4 font-sans">
      {/* Top Header: Bounty ID, Escrow Badge, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-solar-base1/60 pb-3">
        <div className="flex items-center space-x-2 font-mono">
          <span className="font-bold text-sm text-solar-base03 bg-solar-base3 px-2 py-0.5 rounded border border-solar-base1">
            {bounty.bounty_id}
          </span>
          <span className="text-xs text-solar-base01">
            Owner: {shortenAddress(bounty.project_owner, 3)}
          </span>
          {isOwner && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-solar-cyan/20 text-solar-cyan font-bold border border-solar-cyan/40">
              YOU (OWNER)
            </span>
          )}
          {isAuditor && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-solar-yellow/20 text-solar-yellow font-bold border border-solar-yellow/40">
              YOU (AUDITOR)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Escrow Value Badge */}
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-solar-base3 rounded border border-solar-cyan/40 text-xs font-mono font-bold text-solar-cyan">
            <Lock className="w-3 h-3 text-solar-cyan" />
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
          <span className="font-mono font-bold text-solar-base01 uppercase tracking-wider">
            Target Repository:
          </span>
          <a
            href={bounty.target_repo_url}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-solar-blue hover:underline flex items-center space-x-1 truncate max-w-xs"
          >
            <span className="truncate">{bounty.target_repo_url}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>

        <div className="bg-solar-base3 p-3 rounded border border-solar-base1 text-xs">
          <span className="font-mono font-bold text-solar-base02 block mb-1 text-[11px] uppercase tracking-wider">
            Required Invariants & Threat Model:
          </span>
          <p className="text-solar-base00 line-clamp-2 leading-relaxed font-sans">
            {bounty.scope_spec}
          </p>
        </div>
      </div>

      {/* Status 0: OPEN */}
      {bounty.status === 0 && (
        <div className="text-xs font-mono text-solar-base01 bg-solar-cyan/5 p-2.5 rounded border border-solar-cyan/20 flex items-center justify-between">
          <span>Awaiting security auditor submission</span>
          <span className="text-[11px] text-solar-base00">
            Expires block #{bounty.expires_at_block}
          </span>
        </div>
      )}

      {/* Status 1: IN_AUDIT */}
      {bounty.status === 1 && (
        <div className="space-y-2 text-xs font-mono">
          <div className="bg-solar-yellow/10 p-2.5 rounded border border-solar-yellow/30 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-solar-yellow">
              <FileCode className="w-4 h-4" />
              <span className="font-bold">Audit findings submitted</span>
            </div>
            {bounty.report_url && (
              <a
                href={bounty.report_url}
                target="_blank"
                rel="noreferrer"
                className="text-solar-blue hover:underline flex items-center space-x-1"
              >
                <span>View PoC</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="text-[11px] text-solar-base01 flex justify-between">
            <span>Auditor: {shortenAddress(bounty.auditor, 4)}</span>
            <span>Started block #{bounty.audit_started_block}</span>
          </div>
        </div>
      )}

      {/* Status 2: AWAITING_PAYOUT (Cooling-off Challenge Window) */}
      {bounty.status === 2 && (
        <div className="p-3 bg-solar-orange/10 rounded border border-solar-orange/40 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-solar-orange">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="font-bold">24-Hour Cooling-Off Challenge Window</span>
            </div>
            <span className="text-[11px] font-bold">Payout block: #{bounty.payout_ready_at_block}</span>
          </div>

          <div className="flex items-center justify-between bg-solar-base3 p-2 rounded text-[11px]">
            <span className="text-solar-base01">Provisional Verdict:</span>
            <span className={`font-bold ${verdictDisplay.text}`}>{verdictDisplay.label}</span>
          </div>

          <p className="font-sans text-[11px] text-solar-base00">
            Either the Project Owner or Auditor may challenge this assessment before final disbursement.
          </p>
        </div>
      )}

      {/* Status 3: DISPUTED (Appellate Court Phase) */}
      {bounty.status === 3 && (
        <div className="p-3 bg-solar-red/10 rounded border border-solar-red/40 space-y-2 font-mono text-xs">
          <div className="flex items-center space-x-1.5 text-solar-red font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Escrow Under Active Dispute</span>
          </div>
          <div className="bg-solar-base3 p-2 rounded text-[11px] text-solar-base02 border border-solar-base1">
            <span className="font-bold text-solar-red block mb-0.5">Dispute Reason:</span>
            <p className="font-sans italic">{bounty.dispute_reason || bounty.reason}</p>
          </div>
          {bounty.appeal_url && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-solar-base01">Appellate Counter-Evidence:</span>
              <a href={bounty.appeal_url} target="_blank" rel="noreferrer" className="text-solar-blue underline flex items-center space-x-1">
                <span>View Counter-Proof</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Status 4 & 5: Settled (AUDIT_APPROVED or AUDIT_REJECTED) */}
      {(bounty.status === 4 || bounty.status === 5) && (
        <div className="p-3 bg-solar-base3 rounded border border-solar-base1 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-solar-cyan" />
              <span className="text-solar-base01">Settled Verdict:</span>
              <span className={`font-bold ${verdictDisplay.text}`}>
                {verdictDisplay.label}
              </span>
            </div>

            <div className="flex items-center space-x-1 text-solar-base02 font-bold">
              <Award className="w-3.5 h-3.5 text-solar-yellow" />
              <span>Depth: {bounty.depth_score}/100</span>
            </div>
          </div>

          <div className="text-[11px] text-solar-base01 flex justify-between border-t border-solar-base1/40 pt-1.5">
            <span>Settlement:</span>
            <span className="font-bold text-solar-base03">{verdictDisplay.payoutRatio}</span>
          </div>
        </div>
      )}

      {/* Status 6: CANCELLED */}
      {bounty.status === 6 && (
        <div className="p-2.5 bg-solar-base1/10 rounded border border-solar-base1 text-xs font-mono text-solar-base01">
          Bounty cancelled and reclaimed by project owner.
        </div>
      )}

      {/* Action Buttons Footer */}
      <div className="pt-2 border-t border-solar-base1/60 flex flex-wrap items-center justify-between gap-2">
        <div>
          {/* Owner Reclaim Action */}
          {isOwner && (bounty.status === 0 || bounty.status === 1) && (
            <button
              onClick={() => onReclaim(bounty.bounty_id)}
              disabled={isProcessing}
              className="text-[11px] font-mono text-solar-red hover:text-solar-red/80 flex items-center space-x-1 hover:underline disabled:opacity-50"
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
              className="px-3 py-1.5 bg-solar-base02 hover:bg-solar-base03 text-solar-base3 rounded font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 border border-solar-base01 shadow-sm active:scale-95 disabled:opacity-40"
            >
              <Send className="w-3 h-3 text-solar-yellow" />
              <span>Submit Findings & PoC</span>
            </button>
          )}

          {/* Status 1: Trigger AI Adjudication */}
          {bounty.status === 1 && (
            <button
              onClick={() => onAdjudicate(bounty.bounty_id)}
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-solar-cyan hover:bg-solar-cyan/90 text-solar-base3 rounded font-mono text-xs font-bold transition-all flex items-center space-x-1.5 border border-solar-cyan shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-3 h-3 border-2 border-solar-base3 border-t-transparent rounded-full animate-spin"></span>
                  <span>AI Jury Evaluating...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Adjudicate Audit (AI Jury)</span>
                </>
              )}
            </button>
          )}

          {/* Status 2: AWAITING_PAYOUT -> Dispute or Finalize */}
          {bounty.status === 2 && (
            <>
              {isParty && (
                <button
                  onClick={() => onOpenDispute(bounty)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-solar-red/20 hover:bg-solar-red/30 text-solar-red rounded font-mono text-xs font-bold transition-colors border border-solar-red flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Raise Dispute</span>
                </button>
              )}
              <button
                onClick={() => onFinalizeSettlement(bounty.bounty_id)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-solar-green hover:bg-solar-green/90 text-solar-base3 rounded font-mono text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Finalize Settlement</span>
              </button>
            </>
          )}

          {/* Status 3: DISPUTED -> Appellate counter-evidence or Admin resolution */}
          {bounty.status === 3 && (
            <>
              <button
                onClick={() => onOpenAppeal(bounty)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-solar-red hover:bg-solar-red/90 text-solar-base3 rounded font-mono text-xs font-bold transition-colors flex items-center space-x-1"
              >
                <Scale className="w-3 h-3" />
                <span>Submit Appellate Proof</span>
              </button>

              {isAdmin && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onAdminArbitrate(bounty.bounty_id, "AUDIT_PASSED")}
                    className="px-2 py-1 bg-solar-green/20 text-solar-green text-[10px] font-bold rounded border border-solar-green"
                  >
                    Admin: Approve
                  </button>
                  <button
                    onClick={() => onAdminArbitrate(bounty.bounty_id, "AUDIT_REJECTED")}
                    className="px-2 py-1 bg-solar-red/20 text-solar-red text-[10px] font-bold rounded border border-solar-red"
                  >
                    Admin: Reject
                  </button>
                </div>
              )}
            </>
          )}

          {/* Status 4 & 5: Inspect Dossier */}
          {(bounty.status === 4 || bounty.status === 5) && (
            <button
              onClick={() => onInspect(bounty)}
              className="px-3 py-1.5 bg-solar-base3 hover:bg-solar-base1/30 text-solar-base02 rounded font-mono text-xs font-semibold transition-colors flex items-center space-x-1.5 border border-solar-base1"
            >
              <CheckCircle2 className="w-3 h-3 text-solar-cyan" />
              <span>Inspect AI Dossier</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};