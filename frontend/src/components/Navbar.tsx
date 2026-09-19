import React, { useState } from "react";
import { ShieldCheck, Terminal, ExternalLink, Settings, AlertTriangle, Wallet, UserCheck, LogOut } from "lucide-react";
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
  userRole: "PROJECT OWNER" | "SECURITY AUDITOR" | "PLATFORM ADMIN" | "GUEST";
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

  const isZeroBalance = account && (balance === "0" || balance === "0.0" || Number(balance) === 0);

  return (
    <header className="border-b border-solar-base1 bg-solar-base2 text-solar-base02 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Terminal Identifier */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-solar-base02 text-solar-cyan rounded border border-solar-base01">
              <ShieldCheck className="w-6 h-6 text-solar-cyan" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-lg tracking-wider text-solar-base03">
                  AuditPledge
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-solar-cyan/20 text-solar-cyan font-mono font-semibold border border-solar-cyan/40">
                  STUDIONET
                </span>
              </div>
              <p className="text-xs text-solar-base00 hidden sm:block">
                Autonomous Multi-Auditor Consensus & Vulnerability Disclosure Escrow
              </p>
            </div>
          </div>

          {/* Right Controls: Chain Status, Studio Link, Role Badge, Settings, Wallet */}
          <div className="flex items-center space-x-3">
            {/* Active RBAC Role Badge */}
            {account && (
              <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-solar-base3 rounded text-[11px] font-mono border border-solar-base1">
                <UserCheck className="w-3.5 h-3.5 text-solar-cyan" />
                <span className="text-solar-base01">Role:</span>
                <span className="font-bold text-solar-base03">{userRole}</span>
              </div>
            )}

            {/* Chain Network Indicator */}
            <button
              onClick={() => switchToStudioNet().catch(console.error)}
              title="Click to switch MetaMask to GenLayer StudioNet (Chain ID: 61999)"
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-solar-base3 rounded text-xs font-mono text-solar-base01 border border-solar-base1 hover:border-solar-cyan transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-solar-green animate-pulse"></span>
              <span>Chain: 61999</span>
            </button>

            {/* GenLayer Studio External Link */}
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-1 text-xs text-solar-base01 hover:text-solar-cyan transition-colors px-2 py-1"
              title="Open GenLayer Studio IDE"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Contract Address Config Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-solar-base01 hover:text-solar-base03 hover:bg-solar-base3 rounded border border-transparent hover:border-solar-base1 transition-colors"
              title="Configure Deployed Contract Address"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Wallet Connect & Balance */}
            {account ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-solar-base3 px-3 py-1.5 rounded border border-solar-base1 font-mono text-xs shadow-inner">
                  <div className="text-right">
                    <div className="font-bold text-solar-base03">{shortenAddress(account)}</div>
                    <div className="text-[11px] text-solar-cyan font-bold tracking-tight">{balance} GEN</div>
                  </div>
                </div>
                {onDisconnect && (
                  <button
                    onClick={onDisconnect}
                    title="Disconnect Wallet"
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-solar-red/10 hover:bg-solar-red/20 text-solar-red font-mono text-xs rounded border border-solar-red/30 transition-all shadow-sm active:scale-95"
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
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-solar-base02 text-solar-base3 hover:bg-solar-base03 font-mono text-xs rounded border border-solar-base01 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Wallet className="w-3.5 h-3.5 text-solar-cyan" />
                <span>{isConnecting ? "CONNECTING..." : "CONNECT WALLET"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Zero Balance Alert Banner */}
        {isZeroBalance && (
          <div className="mb-2 p-2 bg-solar-yellow/15 border border-solar-yellow text-solar-base03 rounded text-xs flex items-center justify-between font-mono">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-solar-yellow flex-shrink-0" />
              <span>
                Your wallet balance is 0 GEN. Please transfer GEN from the{" "}
                <a
                  href="https://studio.genlayer.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-solar-base02 hover:text-solar-cyan"
                >
                  GenLayer Studio Accounts
                </a>{" "}
                tab to your address ({shortenAddress(account || "")}).
              </span>
            </div>
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs bg-solar-yellow/20 hover:bg-solar-yellow/30 px-2 py-0.5 rounded border border-solar-yellow font-bold"
            >
              Studio Panel
            </a>
          </div>
        )}

        {/* Contract Address Settings Bar */}
        {showSettings && (
          <div className="py-2.5 px-3 mb-2 bg-solar-base3 border border-solar-cyan rounded text-xs font-mono shadow-sm">
            <form onSubmit={handleSaveAddress} className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-solar-base01 font-semibold whitespace-nowrap">
                Contract Address (studionet):
              </span>
              <input
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="0x..."
                className="w-full flex-1 px-2.5 py-1 bg-solar-base2 border border-solar-base1 rounded text-solar-base03 focus:outline-none focus:border-solar-cyan font-mono text-xs"
              />
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-solar-cyan text-solar-base3 rounded font-bold hover:bg-solar-cyan/90 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempAddress(contractAddress);
                    setShowSettings(false);
                  }}
                  className="px-3 py-1 bg-solar-base1/30 text-solar-base01 rounded hover:bg-solar-base1/50 transition-colors"
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