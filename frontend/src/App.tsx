import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Search, AlertCircle, CheckCircle, Terminal, Code2 } from "lucide-react";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { Navbar } from "./components/Navbar";
import { StatsBar } from "./components/StatsBar";
import { BountyCard } from "./components/BountyCard";
import { CreateBountyModal } from "./components/CreateBountyModal";
import { SubmitReportModal } from "./components/SubmitReportModal";
import { JuryInspectorModal } from "./components/JuryInspectorModal";
import { DisputeModal } from "./components/DisputeModal";
import {
  STUDIONET_CONFIG,
  DEFAULT_CONTRACT_ADDRESS,
  AUDIT_PLEDGE_ABI,
  switchToStudioNet,
} from "./config/genlayer";
import { AuditBountyData, parseGENToWei } from "./utils/helpers";

export function App() {
  // Wallet State
  const [account, setAccount] = useState<string | null>(() => {
    return localStorage.getItem("auditpledge_connected_account") || null;
  });
  const [balance, setBalance] = useState<string>("0.0000");
  const [isConnecting, setIsConnecting] = useState(false);

  // Contract State
  const [contractAddress, setContractAddress] = useState<string>(() => {
    return localStorage.getItem("auditpledge_contract_addr") || DEFAULT_CONTRACT_ADDRESS;
  });
  const [platformAdmin, setPlatformAdmin] = useState<string>("");

  // Bounties & Stats (100% On-Chain State)
  const [bounties, setBounties] = useState<AuditBountyData[]>([]);
  const [stats, setStats] = useState({
    totalEscrowLocked: "0",
    totalAuditsResolved: 0,
    totalBounties: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeActionBountyId, setActiveActionBountyId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // UI / Filters
  const [activeTab, setActiveTab] = useState<"ALL" | "OPEN" | "IN_AUDIT" | "COOLING_OFF" | "DISPUTED" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBountyForSubmit, setSelectedBountyForSubmit] = useState<AuditBountyData | null>(null);
  const [selectedBountyForInspect, setSelectedBountyForInspect] = useState<AuditBountyData | null>(null);
  const [disputeModalState, setDisputeModalState] = useState<{
    isOpen: boolean;
    bounty: AuditBountyData | null;
    mode: "DISPUTE" | "APPEAL";
  }>({ isOpen: false, bounty: null, mode: "DISPUTE" });

  const getUserRole = (): "PROJECT OWNER" | "SECURITY AUDITOR" | "PLATFORM ADMIN" | "GUEST" => {
    if (!account) return "GUEST";
    const accLower = account.toLowerCase();
    if (platformAdmin && accLower === platformAdmin.toLowerCase()) return "PLATFORM ADMIN";
    if (bounties.some((b) => b.project_owner && b.project_owner.toLowerCase() === accLower)) return "PROJECT OWNER";
    if (bounties.some((b) => b.auditor && b.auditor.toLowerCase() === accLower)) return "SECURITY AUDITOR";
    return "GUEST";
  };

  const userRole = getUserRole();
  const isAdmin = userRole === "PLATFORM ADMIN";

  // Viem Public Client for StudioNet direct RPC
  const getPublicClient = useCallback(() => {
    return createPublicClient({
      transport: http(STUDIONET_CONFIG.rpcUrl),
    });
  }, []);

  // Fetch live on-chain balance directly from GenLayer StudioNet RPC
  const fetchBalance = useCallback(async (addr: string) => {
    if (!addr) return;
    try {
      const client = getPublicClient();
      const rawBal = await client.getBalance({
        address: addr as `0x${string}`,
      });
      const balNumber = Number(rawBal) / 1e18;
      setBalance(balNumber.toFixed(4));
    } catch (e) {
      console.warn("StudioNet RPC getBalance fallback:", e);
      try {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return;
        const rawBal = await ethereum.request({
          method: "eth_getBalance",
          params: [addr, "latest"],
        });
        const balNumber = Number(BigInt(rawBal)) / 1e18;
        setBalance(balNumber.toFixed(4));
      } catch (fallbackErr) {
        console.error("Failed to read balance", fallbackErr);
      }
    }
  }, [getPublicClient]);

  // Connect Wallet
  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setNotice({ type: "error", msg: "MetaMask is not installed. Please install MetaMask to interact with GenLayer." });
      return;
    }

    setIsConnecting(true);
    try {
      await switchToStudioNet();
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        const selected = accounts[0];
        setAccount(selected);
        localStorage.setItem("auditpledge_connected_account", selected);
        await fetchBalance(selected);
        setNotice({ type: "success", msg: `Connected: ${selected.slice(0, 6)}...${selected.slice(-4)}` });
      }
    } catch (err: any) {
      console.error(err);
      setNotice({ type: "error", msg: err?.message || "Failed to connect wallet." });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Wallet
  const disconnectWallet = () => {
    setAccount(null);
    setBalance("0.0000");
    localStorage.removeItem("auditpledge_connected_account");
    setNotice({ type: "info", msg: "Wallet disconnected successfully." });
  };

  // Save contract address to localStorage
  const handleUpdateContractAddress = (newAddr: string) => {
    setContractAddress(newAddr);
    localStorage.setItem("auditpledge_contract_addr", newAddr);
    setNotice({ type: "info", msg: `Updated contract address to: ${newAddr}` });
  };

  // Load Bounties & Stats from On-Chain Contract (100% Real On-Chain)
  const refreshOnChainData = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = getPublicClient();

      // Read Stats
      try {
        const statsRaw = await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: AUDIT_PLEDGE_ABI,
          functionName: "get_stats",
          args: [],
        });

        if (typeof statsRaw === "string") {
          const parsed = JSON.parse(statsRaw);
          setStats({
            totalEscrowLocked: parsed.total_escrow_locked || "0",
            totalAuditsResolved: Number(parsed.total_audits_resolved || 0),
            totalBounties: Number(parsed.total_bounties || 0),
          });
          if (parsed.platform_admin) {
            setPlatformAdmin(parsed.platform_admin);
          }
        }
      } catch (err) {
        console.warn("Could not read stats view:", err);
      }

      // Read Bounties paginated
      try {
        const bountiesRaw = await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: AUDIT_PLEDGE_ABI,
          functionName: "get_bounties_paginated",
          args: [0, 100],
        });

        if (typeof bountiesRaw === "string") {
          const parsedList: AuditBountyData[] = JSON.parse(bountiesRaw);
          if (Array.isArray(parsedList)) {
            setBounties(parsedList);
            return;
          }
        }
        setBounties([]);
      } catch (err) {
        console.warn("Could not read bounties paginated view:", err);
        setBounties([]);
      }
    } catch (e) {
      console.error("Failed to fetch on-chain data", e);
      setBounties([]);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, getPublicClient]);

  // Periodic Balance Polling (every 6 seconds while connected)
  useEffect(() => {
    if (!account) return;
    fetchBalance(account);
    const timer = setInterval(() => {
      fetchBalance(account);
    }, 6000);
    return () => clearInterval(timer);
  }, [account, fetchBalance]);

  // Initial load and wallet event listeners
  useEffect(() => {
    refreshOnChainData();

    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      // Verify active account if already stored
      ethereum.request({ method: "eth_accounts" }).then((accs: string[]) => {
        if (accs && accs.length > 0) {
          setAccount(accs[0]);
          fetchBalance(accs[0]);
        } else {
          setAccount(null);
          setBalance("0.0000");
          localStorage.removeItem("auditpledge_connected_account");
        }
      }).catch(console.error);

      const handleAccounts = (accs: string[]) => {
        if (accs.length > 0) {
          setAccount(accs[0]);
          localStorage.setItem("auditpledge_connected_account", accs[0]);
          fetchBalance(accs[0]);
        } else {
          disconnectWallet();
        }
      };

      ethereum.on("accountsChanged", handleAccounts);
      ethereum.on("chainChanged", () => {
        if (account) fetchBalance(account);
        refreshOnChainData();
      });

      return () => {
        ethereum.removeListener("accountsChanged", handleAccounts);
      };
    }
  }, [refreshOnChainData, fetchBalance, account]);

  // Transaction Helper
  const sendContractTx = async (functionName: string, args: any[], valueWei: bigint = BigInt(0)) => {
    if (!account) {
      await connectWallet();
    }
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error("Wallet not connected");

    await switchToStudioNet();

    const calldata = encodeFunctionData({
      abi: AUDIT_PLEDGE_ABI,
      functionName,
      args,
    });

    const txParams: any = {
      from: account,
      to: contractAddress,
      data: calldata,
      value: "0x" + valueWei.toString(16),
    };

    const txHash = await ethereum.request({
      method: "eth_sendTransaction",
      params: [txParams],
    });

    return txHash;
  };

  // Action: Create Bounty (Real On-Chain)
  const handleCreateBounty = async (repoUrl: string, scope: string, amountGen: string, durationBlocks: number) => {
    setIsActionLoading(true);
    try {
      const wei = parseGENToWei(amountGen);
      setNotice({ type: "info", msg: "Broadcasting create_audit_bounty transaction to GenLayer StudioNet..." });

      const txHash = await sendContractTx("create_audit_bounty", [repoUrl, scope, durationBlocks], wei);
      setNotice({ type: "info", msg: `Transaction broadcasted: ${txHash.slice(0, 10)}... Awaiting on-chain confirmation...` });

      // Wait for block propagation
      await new Promise((resolve) => setTimeout(resolve, 3500));
      await refreshOnChainData();
      if (account) await fetchBalance(account);

      setNotice({ type: "success", msg: `Bounty created on-chain! Tx: ${txHash.slice(0, 10)}...` });
      setIsCreateOpen(false);
    } catch (err: any) {
      console.error("Create bounty error:", err);
      setNotice({ type: "error", msg: err?.message || "Failed to create bounty on-chain." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Submit Report (Real On-Chain)
  const handleSubmitReport = async (bountyId: string, reportUrl: string) => {
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Submitting audit report for ${bountyId} on-chain...` });

      const txHash = await sendContractTx("submit_audit_report", [bountyId, reportUrl]);
      setNotice({ type: "info", msg: `Report submitted: ${txHash.slice(0, 10)}... Awaiting on-chain confirmation...` });

      await new Promise((resolve) => setTimeout(resolve, 3500));
      await refreshOnChainData();
      if (account) await fetchBalance(account);

      setNotice({ type: "success", msg: `Report submitted for ${bountyId}! Ready for AI Jury evaluation.` });
      setSelectedBountyForSubmit(null);
    } catch (err: any) {
      console.error("Submit report error:", err);
      setNotice({ type: "error", msg: err?.message || "Failed to submit report on-chain." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Adjudicate Audit (Real On-Chain AI Jury Consensus)
  const handleAdjudicate = async (bountyId: string) => {
    setActiveActionBountyId(bountyId);
    setIsActionLoading(true);
    try {
      setNotice({
        type: "info",
        msg: `Executing decentralized AI Jury consensus for ${bountyId} (gl.nondet.web.render & gl.vm.run_nondet)...`,
      });

      const txHash = await sendContractTx("adjudicate_audit", [bountyId]);
      setNotice({ type: "info", msg: `Adjudication consensus tx submitted: ${txHash.slice(0, 10)}... Waiting for validators...` });

      await new Promise((resolve) => setTimeout(resolve, 4500));
      await refreshOnChainData();
      if (account) await fetchBalance(account);

      setNotice({ type: "success", msg: `AI Jury consensus reached on-chain! Tx: ${txHash.slice(0, 10)}...` });
    } catch (err: any) {
      console.error("Adjudication error:", err);
      setNotice({ type: "error", msg: err?.message || "Failed to adjudicate audit on-chain." });
    } finally {
      setIsActionLoading(false);
      setActiveActionBountyId(null);
    }
  };

  // Action: Raise Dispute (Real On-Chain Symmetrical Dispute)
  const handleRaiseDispute = async (bountyId: string, reason: string) => {
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Submitting dispute challenge for ${bountyId} on-chain...` });

      const txHash = await sendContractTx("raise_dispute", [bountyId, reason]);
      setNotice({ type: "info", msg: `Dispute challenge tx submitted: ${txHash.slice(0, 10)}... Moving to Appellate Court...` });

      await new Promise((resolve) => setTimeout(resolve, 3500));
      await refreshOnChainData();
      if (account) await fetchBalance(account);

      setNotice({ type: "success", msg: `Dispute opened on-chain! Moved to Appellate Court. Tx: ${txHash.slice(0, 10)}...` });
      setDisputeModalState({ isOpen: false, bounty: null, mode: "DISPUTE" });
    } catch (err: any) {
      console.error("Raise dispute error:", err);
      setNotice({ type: "error", msg: err?.message || "Failed to raise dispute on-chain." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Finalize Settlement (Real On-Chain Permissionless Finalization)
  const handleFinalizeSettlement = async (bountyId: string) => {
    setActiveActionBountyId(bountyId);
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Finalizing settlement on-chain for ${bountyId}...` });

      const txHash = await sendContractTx("finalize_settlement", [bountyId]);
      setNotice({ type: "info", msg: `Settlement finalization submitted: ${txHash.slice(0, 10)}... Disbursing funds...` });

      await new Promise((resolve) => setTimeout(resolve, 3500));
      await refreshOnChainData();
      if (account) await fetchBalance(account);

      setNotice({ type: "success", msg: `Settlement disbursed on-chain! Tx: ${txHash.slice(0, 10)}...` });
    } catch (err: any) {
      console.error("Finalize settlement error:", err);
      setNotice({ type: "error", msg: err?.message || "Failed to finalize settlement on-chain." });
    } finally {
      setIsActionLoading(false);
      setActiveActionBountyId(null);
    }
  };

  // Action: Submit Appellate Counter-Evidence (Real On-Chain Appellate Consensus)
  const handleAdjudicateAppeal = async (bountyId: string, appealUrl: string) => {
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Submitting appellate counter-evidence on-chain for ${bountyId}...` });

      const txHash = await sendContractTx("adjudicate_appeal", [bountyId, appealUrl]);
      setNotice({ type: "info", msg: `Appellate consensus tx submitted: ${txHash.slice(0, 10)}... Waiting for validators...` });

      await new Promise((resolve) => setTimeout(resolve, 4500));
      await refreshOnChainData();
      if (account) await fetchBalance(account);

      setNotice({ type: "success", msg: `Appellate Court consensus concluded! Tx: ${txHash.slice(0, 10)}...` });
      setDisputeModalState({ isOpen: false, bounty: null, mode: "APPEAL" });
    } catch (err: any) {
      console.error("Appeal error:", err);
      setNotice({ type: "error", msg: err?.message || "Failed to submit appeal on-chain." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Admin Emergency Arbitration (Real On-Chain)
  const handleAdminArbitrate = async (bountyId: string, verdict: string) => {
    setActiveActionBountyId(bountyId);
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Executing Platform Admin arbitration on-chain for ${bountyId}...` });

      const txHash = await sendContractTx("resolve_admin_arbitration", [bountyId, verdict]);
      setNotice({ type: "info", msg: `Admin arbitration tx submitted: ${txHash.slice(0, 10)}... Finalizing...` });

      await new Promise((resolve) => setTimeout(resolve, 3500));
      await refreshOnChainData();
      if (account) await fetchBalance(account);

      setNotice({ type: "success", msg: `Admin arbitration resolved as ${verdict}! Tx: ${txHash.slice(0, 10)}...` });
    } catch (err: any) {
      console.error("Admin arbitrate error:", err);
      setNotice({ type: "error", msg: err?.message || "Failed to arbitrate on-chain." });
    } finally {
      setIsActionLoading(false);
      setActiveActionBountyId(null);
    }
  };

  // Action: Cancel or Reclaim (Real On-Chain)
  const handleReclaim = async (bountyId: string) => {
    setActiveActionBountyId(bountyId);
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Reclaiming escrow on-chain for ${bountyId}...` });

      const txHash = await sendContractTx("cancel_or_reclaim", [bountyId]);
      setNotice({ type: "info", msg: `Reclaim tx submitted: ${txHash.slice(0, 10)}... Refunding escrow...` });

      await new Promise((resolve) => setTimeout(resolve, 3500));
      await refreshOnChainData();
      if (account) await fetchBalance(account);

      setNotice({ type: "success", msg: `Escrow reclaimed on-chain! Tx: ${txHash.slice(0, 10)}...` });
    } catch (err: any) {
      console.error("Reclaim error:", err);
      setNotice({ type: "error", msg: err?.message || "Failed to reclaim escrow on-chain." });
    } finally {
      setIsActionLoading(false);
      setActiveActionBountyId(null);
    }
  };

  // Filter & Search Bounties across 8 Contract Lifecycle States
  const filteredBounties = bounties.filter((b) => {
    // Status filters:
    // 0: OPEN
    // 1: IN_AUDIT
    // 2: AWAITING_PAYOUT (Provisional Pass Cooling-Off)
    // 3: AWAITING_REFUND (Provisional Reject Cooling-Off)
    // 4: DISPUTED (Appellate Court)
    // 5: AUDIT_APPROVED (Settled Payout)
    // 6: AUDIT_REJECTED (Settled Refund)
    // 7: CANCELLED (Reclaimed)
    if (activeTab === "OPEN" && b.status !== 0) return false;
    if (activeTab === "IN_AUDIT" && b.status !== 1) return false;
    if (activeTab === "COOLING_OFF" && b.status !== 2 && b.status !== 3) return false;
    if (activeTab === "DISPUTED" && b.status !== 4) return false;
    if (activeTab === "RESOLVED" && b.status !== 5 && b.status !== 6 && b.status !== 7) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.bounty_id.toLowerCase().includes(q) ||
        b.target_repo_url.toLowerCase().includes(q) ||
        b.project_owner.toLowerCase().includes(q) ||
        b.auditor.toLowerCase().includes(q) ||
        b.scope_spec.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-solar-base3 text-solar-base02 flex flex-col font-sans">
      {/* Top Terminal Bar with Disconnect Button and Direct Balance */}
      <Navbar
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        contractAddress={contractAddress}
        onUpdateContractAddress={handleUpdateContractAddress}
        userRole={userRole}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Notice Alert Banner */}
        {notice && (
          <div
            className={`p-3 rounded border text-xs font-mono flex items-center justify-between shadow-sm animate-in fade-in duration-150 ${
              notice.type === "success"
                ? "bg-solar-green/15 border-solar-green text-solar-green"
                : notice.type === "error"
                ? "bg-solar-red/15 border-solar-red text-solar-red"
                : "bg-solar-cyan/15 border-solar-cyan text-solar-cyan"
            }`}
          >
            <div className="flex items-center space-x-2">
              {notice.type === "success" ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{notice.msg}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-xs font-bold px-1.5 hover:opacity-80"
            >
              &times;
            </button>
          </div>
        )}

        {/* Hero Pitch Banner */}
        <div className="bg-solar-base2 border border-solar-base1 rounded p-6 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded bg-solar-base02 text-solar-cyan font-mono text-xs font-bold border border-solar-base01">
                AGENTIC SECURITY INFRASTRUCTURE
              </span>
              <span className="text-xs font-mono text-solar-base01">
                GenLayer Studionet (Chain 61999) &bull; 100% On-Chain State
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-solar-base03 leading-tight">
              Autonomous Multi-Auditor Consensus & Vulnerability Disclosure Escrow
            </h1>
            <p className="text-sm text-solar-base00 leading-relaxed font-sans">
              AuditPledge eliminates asymmetric audit risks between developers and security auditors.
              Powered by GenLayer’s on-chain web rendering and decentralized AI subjective consensus (<code className="font-mono text-solar-cyan bg-solar-base3 px-1 rounded">gl.vm.run_nondet</code>),
              featuring <strong>Symmetrical 20-Block Cooling-Off Windows</strong> (protecting both Owner against false reports and Auditor against wrongful rejections),
              a <strong>Graduated Payout Settlement Matrix</strong> (100% Critical / 40% Partial / 0% Reject), and an <strong>On-Chain Appellate Security Court</strong>.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-solar-cyan hover:bg-solar-cyan/90 text-solar-base3 font-mono font-bold text-xs rounded border border-solar-cyan transition-all shadow-sm flex items-center space-x-2 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Audit Escrow Bounty</span>
              </button>

              <a
                href="https://studio.genlayer.com"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-solar-base3 hover:bg-solar-base1/30 text-solar-base02 font-mono text-xs font-semibold rounded border border-solar-base1 transition-colors flex items-center space-x-1.5"
              >
                <Terminal className="w-4 h-4 text-solar-cyan" />
                <span>Open GenLayer Studio IDE</span>
              </a>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Bar */}
        <StatsBar
          totalEscrowLocked={stats.totalEscrowLocked}
          totalAuditsResolved={stats.totalAuditsResolved}
          totalBounties={bounties.length}
          isLoading={isLoading}
          onRefresh={refreshOnChainData}
        />

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-solar-base2 p-1 rounded border border-solar-base1 font-mono text-xs w-full sm:w-auto overflow-x-auto">
            {(["ALL", "OPEN", "IN_AUDIT", "COOLING_OFF", "DISPUTED", "RESOLVED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-solar-base02 text-solar-base3 font-bold shadow-sm"
                    : "text-solar-base01 hover:text-solar-base03 hover:bg-solar-base3/50"
                }`}
              >
                {tab === "ALL" && `All Escrows (${bounties.length})`}
                {tab === "OPEN" && `Open (${bounties.filter((b) => b.status === 0).length})`}
                {tab === "IN_AUDIT" && `In Review (${bounties.filter((b) => b.status === 1).length})`}
                {tab === "COOLING_OFF" && `Cooling-Off (${bounties.filter((b) => b.status === 2 || b.status === 3).length})`}
                {tab === "DISPUTED" && `Appeals (${bounties.filter((b) => b.status === 4).length})`}
                {tab === "RESOLVED" && `Settled (${bounties.filter((b) => b.status === 5 || b.status === 6 || b.status === 7).length})`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-solar-base01" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, repo or invariant..."
              className="w-full pl-9 pr-3 py-1.5 bg-solar-base2 border border-solar-base1 rounded text-xs text-solar-base03 font-mono focus:outline-none focus:border-solar-cyan"
            />
          </div>
        </div>

        {/* Bounties Grid (Real On-Chain State Only) */}
        <div className="space-y-4">
          {filteredBounties.length === 0 ? (
            <div className="bg-solar-base2 border border-solar-base1 rounded p-12 text-center space-y-3 font-mono">
              <Code2 className="w-8 h-8 text-solar-base01 mx-auto" />
              <div className="text-sm font-bold text-solar-base03">
                {bounties.length === 0 ? "No On-Chain Bounties Yet" : "No Matching Escrows Found"}
              </div>
              <p className="text-xs text-solar-base00 max-w-md mx-auto font-sans leading-relaxed">
                {bounties.length === 0
                  ? `The smart contract at ${contractAddress.slice(0, 10)}... currently has 0 registered escrows. Click 'Create Audit Escrow Bounty' above to lock GEN and deploy the first real on-chain audit bounty on GenLayer StudioNet!`
                  : "No audit escrow pools currently registered under this filter tab or search query."}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-solar-cyan text-solar-base3 rounded text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Bounty on GenLayer</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBounties.map((bounty) => (
                <BountyCard
                  key={bounty.bounty_id}
                  bounty={bounty}
                  account={account}
                  isAdmin={isAdmin}
                  onOpenSubmit={(b) => setSelectedBountyForSubmit(b)}
                  onAdjudicate={handleAdjudicate}
                  onOpenDispute={(b) => setDisputeModalState({ isOpen: true, bounty: b, mode: "DISPUTE" })}
                  onFinalizeSettlement={handleFinalizeSettlement}
                  onOpenAppeal={(b) => setDisputeModalState({ isOpen: true, bounty: b, mode: "APPEAL" })}
                  onAdminArbitrate={handleAdminArbitrate}
                  onReclaim={handleReclaim}
                  onInspect={(b) => setSelectedBountyForInspect(b)}
                  isActionLoading={isActionLoading}
                  activeActionBountyId={activeActionBountyId}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-solar-base1 bg-solar-base2 py-4 mt-12 text-xs font-mono text-solar-base01">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AuditPledge &copy; 2026 &bull; Autonomous Web3 Security Escrow & Appellate Court
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Target: GenLayer studionet (0xF1EF)</span>
            <span>&bull;</span>
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-solar-cyan underline"
            >
              Studio Console
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateBountyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateBounty}
        isSubmitting={isActionLoading}
      />

      <SubmitReportModal
        isOpen={!!selectedBountyForSubmit}
        onClose={() => setSelectedBountyForSubmit(null)}
        bountyId={selectedBountyForSubmit?.bounty_id || ""}
        targetRepoUrl={selectedBountyForSubmit?.target_repo_url || ""}
        scopeSpec={selectedBountyForSubmit?.scope_spec || ""}
        onSubmit={handleSubmitReport}
        isSubmitting={isActionLoading}
      />

      <JuryInspectorModal
        isOpen={!!selectedBountyForInspect}
        onClose={() => setSelectedBountyForInspect(null)}
        bounty={selectedBountyForInspect}
      />

      <DisputeModal
        isOpen={disputeModalState.isOpen}
        onClose={() => setDisputeModalState({ isOpen: false, bounty: null, mode: "DISPUTE" })}
        bounty={disputeModalState.bounty}
        mode={disputeModalState.mode}
        onSubmitDispute={handleRaiseDispute}
        onSubmitAppeal={handleAdjudicateAppeal}
        isSubmitting={isActionLoading}
      />
    </div>
  );
}

export default App;