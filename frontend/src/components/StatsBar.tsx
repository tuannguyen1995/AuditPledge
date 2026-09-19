import React from "react";
import { Lock, RefreshCw, Scale, ShieldCheck, Activity, Cpu } from "lucide-react";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
      {/* Stat 1: Total Escrow Secured */}
      <div className="bg-cyber-card border border-cyber-border hover:border-neon-cyan/40 rounded-lg p-4 transition-all shadow-md group">
        <div className="flex items-center justify-between text-xs text-cyber-muted mb-1">
          <span className="flex items-center space-x-1.5 uppercase tracking-wider text-[11px] font-bold">
            <Lock className="w-3.5 h-3.5 text-neon-cyan group-hover:rotate-12 transition-transform" />
            <span>Escrow Locked</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan font-bold border border-neon-cyan/20">
            TVL
          </span>
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {formatGEN(totalEscrowLocked)}
        </div>
        <p className="text-[11px] text-cyber-subtle mt-1 font-sans">
          GEN assets locked in autonomous custody
        </p>
      </div>

      {/* Stat 2: Settled Security Audits */}
      <div className="bg-cyber-card border border-cyber-border hover:border-neon-emerald/40 rounded-lg p-4 transition-all shadow-md group">
        <div className="flex items-center justify-between text-xs text-cyber-muted mb-1">
          <span className="flex items-center space-x-1.5 uppercase tracking-wider text-[11px] font-bold">
            <Scale className="w-3.5 h-3.5 text-neon-emerald group-hover:scale-110 transition-transform" />
            <span>Settled Audits</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-emerald/10 text-neon-emerald font-bold border border-neon-emerald/20">
            VERIFIED
          </span>
        </div>
        <div className="text-xl font-bold text-neon-emerald tracking-tight">
          {totalAuditsResolved} Disclosures
        </div>
        <p className="text-[11px] text-cyber-subtle mt-1 font-sans">
          Adjudicated via AI consensus & appeals
        </p>
      </div>

      {/* Stat 3: Active Escrow Pools */}
      <div className="bg-cyber-card border border-cyber-border hover:border-neon-amber/40 rounded-lg p-4 transition-all shadow-md group">
        <div className="flex items-center justify-between text-xs text-cyber-muted mb-1">
          <span className="flex items-center space-x-1.5 uppercase tracking-wider text-[11px] font-bold">
            <Activity className="w-3.5 h-3.5 text-neon-amber group-hover:scale-110 transition-transform" />
            <span>Escrow Pools</span>
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-[11px] text-cyber-muted hover:text-white flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-cyber-surface transition-colors disabled:opacity-50"
            title="Refresh on-chain state"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-neon-cyan" : ""}`} />
            <span className="text-[10px]">SYNC</span>
          </button>
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {totalBounties} Repositories
        </div>
        <p className="text-[11px] text-cyber-subtle mt-1 font-sans">
          Bounties deployed on GenLayer
        </p>
      </div>

      {/* Stat 4: Canary Defense & Consensus Telemetry */}
      <div className="bg-cyber-card border border-cyber-border hover:border-neon-cyan/40 rounded-lg p-4 transition-all shadow-md">
        <div className="flex items-center justify-between text-xs text-cyber-muted mb-1">
          <span className="flex items-center space-x-1.5 uppercase tracking-wider text-[11px] font-bold">
            <Cpu className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Canary Defense</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse"></span>
        </div>
        <div className="text-sm font-bold text-white flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-neon-emerald" />
          <span className="text-xs">IMMUNE TO PROMPT-INJECTION</span>
        </div>
        <p className="text-[11px] text-cyber-subtle mt-1 font-sans">
          Multi-agent canary token verification
        </p>
      </div>
    </div>
  );
};