import React from "react";
import { Lock, CheckCircle2, FileText, Cpu, RefreshCw } from "lucide-react";
import { formatGEN } from "../utils/helpers";

interface StatsBarProps {
  totalEscrowLocked: string;
  totalAuditsResolved: number;
  totalBounties: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalEscrowLocked,
  totalAuditsResolved,
  totalBounties,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-6">
      {/* Stat 1: Total Escrow Locked */}
      <div className="bg-solar-base2 border border-solar-base1 rounded p-4 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-solar-base01">
            Total Escrow Locked
          </span>
          <Lock className="w-4 h-4 text-solar-cyan" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-mono font-bold text-solar-base03">
            {formatGEN(totalEscrowLocked)}
          </span>
        </div>
        <p className="text-[11px] text-solar-base00 mt-1">Guaranteed on-chain security bounty</p>
      </div>

      {/* Stat 2: Audits Resolved */}
      <div className="bg-solar-base2 border border-solar-base1 rounded p-4 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-solar-base01">
            Audits Resolved
          </span>
          <CheckCircle2 className="w-4 h-4 text-solar-green" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-mono font-bold text-solar-green">
            {totalAuditsResolved}
          </span>
        </div>
        <p className="text-[11px] text-solar-base00 mt-1">Evaluated by decentralized AI consensus</p>
      </div>

      {/* Stat 3: Total Bounties */}
      <div className="bg-solar-base2 border border-solar-base1 rounded p-4 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-solar-base01">
            Total Escrow Pools
          </span>
          <FileText className="w-4 h-4 text-solar-yellow" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-mono font-bold text-solar-base03">
            {totalBounties}
          </span>
        </div>
        <p className="text-[11px] text-solar-base00 mt-1">Registered smart contract repositories</p>
      </div>

      {/* Stat 4: Consensus Engine Info */}
      <div className="bg-solar-base2 border border-solar-base1 rounded p-4 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-solar-base01">
            Consensus Engine
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh on-chain state"
              className="p-1 text-solar-base01 hover:text-solar-cyan rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-solar-cyan" : ""}`} />
            </button>
            <Cpu className="w-4 h-4 text-solar-cyan" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-sm font-mono font-bold text-solar-cyan">
            gl.vm.run_nondet
          </span>
        </div>
        <p className="text-[11px] text-solar-base00 mt-1">
          Web Render & Subjective Semantic Verdict
        </p>
      </div>
    </div>
  );
};