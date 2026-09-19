import React from "react";
import { X, Scale, ExternalLink, ShieldCheck, ShieldAlert, Award, FileText, CheckCircle2, XCircle } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-solar-base03/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-solar-base2 border border-solar-base1 rounded max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-solar-base1 bg-solar-base3">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-solar-cyan" />
            <h3 className="font-mono font-bold text-base text-solar-base03">
              On-Chain AI Jury Inspection Dossier
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-solar-base01 hover:text-solar-base03 p-1 rounded hover:bg-solar-base2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Verdict Banner */}
          <div
            className={`p-4 rounded border flex items-center justify-between ${
              isPassed
                ? "bg-solar-green/10 border-solar-green text-solar-green"
                : isRejected
                ? "bg-solar-red/10 border-solar-red text-solar-red"
                : "bg-solar-yellow/10 border-solar-yellow text-solar-yellow"
            }`}
          >
            <div className="flex items-center space-x-3">
              {isPassed ? (
                <ShieldCheck className="w-8 h-8 text-solar-green flex-shrink-0" />
              ) : isRejected ? (
                <ShieldAlert className="w-8 h-8 text-solar-red flex-shrink-0" />
              ) : (
                <Scale className="w-8 h-8 text-solar-yellow flex-shrink-0" />
              )}
              <div>
                <div className="text-xs font-mono uppercase tracking-widest font-semibold text-solar-base01">
                  Decentralized Consensus Verdict
                </div>
                <div className="text-xl font-mono font-bold">
                  {verdictDisplay.label}
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs text-solar-base01 block">Bounty ID</span>
              <span className="font-bold text-solar-base03">{bounty.bounty_id}</span>
            </div>
          </div>

          {/* Metric Meters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Technical Depth Score */}
            <div className="bg-solar-base3 border border-solar-base1 rounded p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-solar-base01 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-solar-yellow" />
                  <span>Technical Depth Score</span>
                </span>
                <span className="font-mono font-bold text-sm text-solar-base03">
                  {bounty.depth_score} / 100
                </span>
              </div>
              {/* Progress bar with 70 threshold marker */}
              <div className="w-full bg-solar-base2 h-3 rounded-full overflow-hidden relative border border-solar-base1">
                <div
                  className={`h-full rounded-full transition-all ${
                    bounty.depth_score >= 70 ? "bg-solar-green" : "bg-solar-red"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, bounty.depth_score))}%` }}
                ></div>
                {/* 70 Threshold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-solar-base03"
                  style={{ left: "70%" }}
                  title="Passing Threshold: 70"
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-solar-base00">
                <span>0 (Spam/Trivial)</span>
                <span className="font-bold text-solar-cyan">Req: &ge; 70</span>
                <span>100 (Rigorous PoC)</span>
              </div>
            </div>

            {/* Validator Consensus Confidence */}
            <div className="bg-solar-base3 border border-solar-base1 rounded p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-solar-base01 flex items-center space-x-1">
                  <Scale className="w-3.5 h-3.5 text-solar-cyan" />
                  <span>Validator Consensus Confidence</span>
                </span>
                <span className="font-mono font-bold text-sm text-solar-base03">
                  {bounty.confidence}%
                </span>
              </div>
              <div className="w-full bg-solar-base2 h-3 rounded-full overflow-hidden border border-solar-base1">
                <div
                  className="h-full bg-solar-cyan rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(5, bounty.confidence))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-solar-base00">
                <span>Subjective Semantic Agreement</span>
                <span>gl.vm.run_nondet</span>
              </div>
            </div>
          </div>

          {/* Qualitative Assessment / Reason */}
          <div className="bg-solar-base3 border border-solar-base1 rounded p-4 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-solar-base02 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-solar-cyan" />
              <span>AI Security Jury Qualitative Assessment</span>
            </div>
            <div className="p-3 bg-solar-base2 rounded border border-solar-base1/60 text-xs font-sans text-solar-base02 leading-relaxed whitespace-pre-wrap">
              {bounty.reason || "No qualitative assessment recorded."}
            </div>
          </div>

          {/* Settlement & Financial Flow */}
          <div className="bg-solar-base3 border border-solar-base1 rounded p-4 text-xs font-mono space-y-2">
            <span className="font-bold text-solar-base02 block uppercase tracking-wider text-[11px]">
              Escrow Settlement Flow:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-solar-base2 rounded border border-solar-base1/60">
                <span className="text-solar-base01 block text-[11px]">Project Owner:</span>
                <span className="font-bold text-solar-base03">{shortenAddress(bounty.project_owner, 6)}</span>
              </div>
              <div className="p-2 bg-solar-base2 rounded border border-solar-base1/60">
                <span className="text-solar-base01 block text-[11px]">Security Auditor:</span>
                <span className="font-bold text-solar-base03">{shortenAddress(bounty.auditor, 6)}</span>
              </div>
            </div>

            <div className="p-2.5 bg-solar-base2 rounded border border-solar-base1 flex items-center justify-between mt-2">
              <span className="text-solar-base01">Disbursement Outcome:</span>
              <span className="font-bold flex items-center space-x-1">
                {isPassed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-solar-green" />
                    <span className="text-solar-green">
                      {formatGEN(bounty.escrow_amount)} disbursed to Auditor
                    </span>
                  </>
                ) : isRejected ? (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-solar-red" />
                    <span className="text-solar-red">
                      {formatGEN(bounty.escrow_amount)} refunded to Project Owner
                    </span>
                  </>
                ) : (
                  <span className="text-solar-yellow">
                    {formatGEN(bounty.escrow_amount)} currently locked in escrow
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Source Evidence Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-solar-base1 text-xs font-mono text-solar-base01">
            <a
              href={bounty.target_repo_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-solar-blue hover:underline"
            >
              <span>Target Repo</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {bounty.report_url && (
              <a
                href={bounty.report_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-solar-cyan hover:underline"
              >
                <span>Submitted PoC Evidence Report</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-solar-base1 bg-solar-base3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-solar-base2 hover:bg-solar-base1/30 text-solar-base02 rounded font-mono text-xs border border-solar-base1 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};