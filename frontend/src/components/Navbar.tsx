import React, { useState } from "react";
import { ShieldCheck, Terminal, ExternalLink, Settings, AlertTriangle, Wallet, UserCheck, LogOut, Radio, Lock } from "lucide-react";
import { switchToStudioNet } from "../config/genlayer";
import { shortenAddress } from "../utils/helpers";

interface NavbarProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect?: () => void;
  contractAddress: string;
  onUpdateContractAddress: (addr: string) => void;
  userRole: "PROJECT OWNER" | "SECURITY AUDITOR" | "GUEST";
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  balance,
  isConnecting,
  onConnect,
  onDisconnect,
  contractAddress,
  onUpdateContractAddress,
  userRole,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempAddress, setTempAddress] = useState(contractAddress);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempAddress.trim().startsWith("0x")) {
      onUpdateContractAddress(tempAddress.trim());
      setShowSettings(false);
    }
  };

  const isZeroBalance = account && (balance === "0" || balance === "0.0" || balance === "0.0000" || Number(balance) === 0);

  return (
    <header className="border-b border-cyber-border bg-cyber-bg/95 backdrop-blur-md text-cyber-text sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & SOC Terminal Identifier */}
          <div className="flex items-center space-x-3">
            <div className="relative p-2 bg-cyber-card rounded-lg border border-neon-cyan/40 shadow-inner group">
              <ShieldCheck className="w-6 h-6 text-neon-cyan group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-emerald rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-emerald rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-lg tracking-wider text-white flex items-center gap-1.5">
                  AUDIT<span className="text-neon-cyan">PLEDGE</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan font-mono font-bold border border-neon-cyan/30 tracking-wider">
                  STUDIONET SOC
                </span>
              </div>
              <p className="text-[11px] text-cyber-muted hidden sm:flex items-center space-x-2">
                <span>Autonomous Vulnerability Escrow</span>
                <span className="text-cyber-subtle">&bull;</span>
                <span className="text-neon-emerald flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Canary Shield Active</span>
                </span>
              </p>
            </div>
          </div>

          {/* Right Controls: Canary Badge, Network Beacon, Role, Settings, Wallet */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Active RBAC Role Badge */}
            {account && (
              <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 bg-cyber-card rounded-md text-[11px] font-mono border border-cyber-border">
                <UserCheck className="w-3.5 h-3.5 text-neon-cyan" />
                <span className="text-cyber-subtle">Role:</span>
                <span className="font-bold text-white tracking-wide">{userRole}</span>
              </div>
            )}

            {/* Chain Network Beacon */}
            <button
              onClick={() => switchToStudioNet().catch(console.error)}
              title="Click to switch MetaMask to GenLayer StudioNet (Chain ID: 61999)"
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-cyber-card hover:bg-cyber-surface rounded-md text-xs font-mono text-cyber-muted border border-cyber-border hover:border-neon-cyan/50 transition-colors"
            >
              <Radio className="w-3 h-3 text-neon-emerald animate-pulse" />
              <span className="text-white font-semibold">Chain 61999</span>
            </button>

            {/* GenLayer Studio External Link */}
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center space-x-1 text-xs text-cyber-muted hover:text-neon-cyan transition-colors px-2 py-1 font-mono"
              title="Open GenLayer Studio IDE"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Studio IDE</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Contract Config Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-cyber-muted hover:text-white hover:bg-cyber-card rounded-md border border-transparent hover:border-cyber-border transition-colors"
              title="Configure Deployed Contract Address"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Wallet Connect & Balance with Cyber Style */}
            {account ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2.5 bg-cyber-card px-3 py-1.5 rounded-md border border-cyber-border font-mono text-xs shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse"></div>
                  <div className="text-right">
                    <div className="font-bold text-white tracking-wide">{shortenAddress(account)}</div>
                    <div className="text-[11px] text-neon-cyan font-bold tracking-tight">{balance} GEN</div>
                  </div>
                </div>
                {onDisconnect && (
                  <button
                    onClick={onDisconnect}
                    title="Disconnect Wallet"
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-neon-crimson/10 hover:bg-neon-crimson/20 text-neon-crimson font-mono text-xs rounded-md border border-neon-crimson/30 transition-all active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-semibold">Disconnect</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-neon-cyan/90 to-neon-emerald/90 hover:from-neon-cyan hover:to-neon-emerald text-cyber-bg font-mono text-xs font-bold rounded-md shadow-lg transition-all active:scale-95 disabled:opacity-50 tracking-wider"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? "CONNECTING..." : "CONNECT WALLET"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Zero Balance Alert Banner */}
        {isZeroBalance && (
          <div className="mb-2 p-2 bg-neon-amber/10 border border-neon-amber/40 text-cyber-text rounded-md text-xs flex items-center justify-between font-mono">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-neon-amber flex-shrink-0" />
              <span>
                Your wallet balance is 0.0000 GEN. Fund your address from the{" "}
                <a
                  href="https://studio.genlayer.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-neon-cyan hover:text-white"
                >
                  GenLayer Studio Accounts tab
                </a>{" "}
                ({shortenAddress(account || "")}).
              </span>
            </div>
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] bg-neon-amber/20 hover:bg-neon-amber/30 text-neon-amber px-2 py-0.5 rounded border border-neon-amber/40 font-bold ml-2 whitespace-nowrap"
            >
              Get Studio GEN &rarr;
            </a>
          </div>
        )}

        {/* Contract Address Settings Bar */}
        {showSettings && (
          <div className="py-2.5 px-3 mb-2 bg-cyber-card border border-neon-cyan/50 rounded-md text-xs font-mono shadow-md">
            <form onSubmit={handleSaveAddress} className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-cyber-muted font-semibold whitespace-nowrap">
                Deployed Contract (StudioNet):
              </span>
              <input
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="0x..."
                className="w-full flex-1 px-2.5 py-1 bg-cyber-surface border border-cyber-border rounded text-white focus:outline-none focus:border-neon-cyan font-mono text-xs"
              />
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-neon-cyan text-cyber-bg rounded font-bold hover:bg-neon-cyan/90 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempAddress(contractAddress);
                    setShowSettings(false);
                  }}
                  className="px-3 py-1 bg-cyber-surface text-cyber-muted rounded hover:bg-cyber-border transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};