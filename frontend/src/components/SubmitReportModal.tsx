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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-solar-base03/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-solar-base2 border border-solar-base1 rounded max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-solar-base1 bg-solar-base3">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-solar-yellow" />
            <h3 className="font-mono font-bold text-base text-solar-base03">
              Auditor Portal: Submit Findings & PoC
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
          {/* Target Info Summary */}
          <div className="p-3 bg-solar-base3 border border-solar-base1 rounded text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-solar-base01">Target Bounty:</span>
              <span className="font-bold text-solar-cyan">{bountyId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-solar-base01">Target Repository:</span>
              <a
                href={targetRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-solar-blue underline truncate max-w-xs"
              >
                {targetRepoUrl}
              </a>
            </div>
            <div className="text-solar-base00 font-sans pt-1 border-t border-solar-base1/40">
              <span className="font-mono font-bold text-solar-base01">Required Invariants: </span>
              {scopeSpec}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-solar-base01 font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-solar-yellow" />
              <span>Test Report Fixtures (Select to evaluate):</span>
            </div>
            <div className="space-y-2">
              {DEMO_REPORTS.map((report, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyPreset(report)}
                  className={`p-2.5 rounded border cursor-pointer transition-all text-xs font-mono ${
                    reportUrl === report.url
                      ? "bg-solar-base3 border-solar-cyan shadow-sm"
                      : "bg-solar-base3/60 border-solar-base1 hover:border-solar-base01"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-solar-base03">
                      {report.type === "PASSING" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-solar-green" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-solar-red" />
                      )}
                      <span>{report.title}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        report.type === "PASSING"
                          ? "bg-solar-green/20 text-solar-green"
                          : "bg-solar-red/20 text-solar-red"
                      }`}
                    >
                      {report.type}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-solar-base00 mt-1">
                    {report.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 bg-solar-red/15 border border-solar-red text-solar-red rounded text-xs flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Report URL input */}
          <div>
            <label className="block text-xs font-mono font-bold text-solar-base02 mb-1 uppercase tracking-wider">
              Live Public Report & PoC URL *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/auditor/reports/main/findings.md"
                className="w-full px-3 py-2 bg-solar-base3 border border-solar-base1 rounded text-sm text-solar-base03 focus:outline-none focus:border-solar-cyan font-mono"
              />
              <FileCode className="absolute right-3 top-2.5 w-4 h-4 text-solar-base01" />
            </div>
            <p className="text-[11px] text-solar-base00 mt-1">
              Must be a live, publicly accessible URL. GenLayer validators will fetch and render this URL on-chain via <code className="text-solar-cyan font-mono">gl.nondet.web.render</code>.
            </p>
          </div>

          {/* Guidelines */}
          <div className="p-3 bg-solar-base3 border border-solar-base1 rounded text-xs text-solar-base01">
            <h4 className="font-mono font-bold text-solar-base02 mb-1">
              AI Security Court Evaluation Guidelines:
            </h4>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-solar-base00">
              <li>Must contain demonstrable vulnerability logic or executable PoC script.</li>
              <li>Generic automated linter or typo outputs will be filtered out as spam.</li>
              <li>Minimum Technical Depth Score of 70/100 required for automatic bounty disbursement.</li>
            </ul>
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
              className="px-5 py-2 bg-solar-yellow hover:bg-solar-yellow/90 text-solar-base03 font-mono font-bold text-xs rounded border border-solar-yellow transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-solar-base03 border-t-transparent rounded-full animate-spin"></span>
                  <span>Submitting to Chain...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Audit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};