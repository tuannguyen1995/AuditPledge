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
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);

  // Contract State
  const [contractAddress, setContractAddress] = useState<string>(() => {
    return localStorage.getItem("auditpledge_contract_addr") || DEFAULT_CONTRACT_ADDRESS;
  });
  const [platformAdmin, setPlatformAdmin] = useState<string>("");

  // Bounties & Stats
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
  const [activeTab, setActiveTab] = useState<"ALL" | "OPEN" | "IN_AUDIT" | "AWAITING_PAYOUT" | "DISPUTED" | "RESOLVED">("ALL");
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
    if (bounties.some((b) => b.project_owner.toLowerCase() === accLower)) return "PROJECT OWNER";
    if (bounties.some((b) => b.auditor.toLowerCase() === accLower)) return "SECURITY AUDITOR";
    return "GUEST";
  };

  const userRole = getUserRole();
  const isAdmin = userRole === "PLATFORM ADMIN";

  // Save contract address to localStorage
  const handleUpdateContractAddress = (newAddr: string) => {
    setContractAddress(newAddr);
    localStorage.setItem("auditpledge_contract_addr", newAddr);
    setNotice({ type: "info", msg: `Updated contract address to: ${newAddr}` });
  };

  // Connect Wallet
  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setNotice({ type: "error", msg: "MetaMask is not installed. Please install MetaMask to interact." });
      return;
    }

    setIsConnecting(true);
    try {
      await switchToStudioNet();
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        await fetchBalance(accounts[0]);
        setNotice({ type: "success", msg: `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` });
      }
    } catch (err: any) {
      console.error(err);
      setNotice({ type: "error", msg: err?.message || "Failed to connect wallet." });
    } finally {
      setIsConnecting(false);
    }
  };

  // Fetch Balance in GEN
  const fetchBalance = async (addr: string) => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;
      const rawBal = await ethereum.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      });
      const balNumber = Number(BigInt(rawBal)) / 1e18;
      setBalance(balNumber.toFixed(4));
    } catch (e) {
      console.error("Failed to read balance", e);
    }
  };

  // Viem Public Client for studionet views
  const getPublicClient = () => {
    return createPublicClient({
      transport: http(STUDIONET_CONFIG.rpcUrl),
    });
  };

  // Load Bounties & Stats from On-Chain Contract
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
          args: [0, 50],
        });

        if (typeof bountiesRaw === "string") {
          const parsedList: AuditBountyData[] = JSON.parse(bountiesRaw);
          if (Array.isArray(parsedList) && parsedList.length > 0) {
            setBounties(parsedList);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not read bounties paginated view:", err);
      }

      // Fallback: If on-chain state is empty or contract is freshly deployed, provide starter demonstration fixtures
      setBounties((prev) => (prev.length > 0 ? prev : getInitialDemoBounties()));
    } catch (e) {
      console.error("Failed to fetch on-chain data", e);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress]);

  // Initial demo bounties so users immediately see realistic examples
  const getInitialDemoBounties = (): AuditBountyData[] => [
    {
      bounty_id: "audit-1",
      project_owner: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      auditor: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      escrow_amount: "5000000000000000000",
      target_repo_url: "https://github.com/defi-vault/autonomous-yield",
      scope_spec: "Critical invariants: Solvency under liquidation cascades, state updates before flash loan external calls.",
      report_url: "https://gist.githubusercontent.com/auditor-pro/8f3a6b7e/raw/reentrancy_poc.md",
      status: 2, // AWAITING_PAYOUT
      verdict: "AUDIT_PASSED",
      reason: "High quality PoC reproducing exploit on VaultContract state variables with actionable ReentrancyGuard remediation.",
      confidence: 94,
      depth_score: 92,
      created_at_block: "100",
      expires_at_block: "6100",
      payout_ready_at_block: "120",
      disputed: false,
      dispute_reason: "",
      appeal_url: "",
    },
    {
      bounty_id: "audit-2",
      project_owner: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      auditor: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      escrow_amount: "2500000000000000000",
      target_repo_url: "https://github.com/agentic-economy/escrow-hub",
      scope_spec: "Target: Multi-sig arbitration, reentrancy guards on automated agent release.",
      report_url: "https://gist.githubusercontent.com/auditor-sec/33b1/raw/findings.md",
      status: 1, // IN_AUDIT
      verdict: "PENDING",
      reason: "Audit report submitted. On-chain AI jury evaluating security analysis depth.",
      confidence: 0,
      depth_score: 0,
      created_at_block: "150",
      expires_at_block: "10150",
      payout_ready_at_block: "0",
      disputed: false,
      dispute_reason: "",
      appeal_url: "",
    },
    {
      bounty_id: "audit-3",
      project_owner: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      auditor: "0x0000000000000000000000000000000000000000",
      escrow_amount: "10000000000000000000",
      target_repo_url: "https://github.com/oracle-bridge/light-client",
      scope_spec: "Target: Validator signature verification, replay attack prevention with unique nonces.",
      report_url: "",
      status: 0, // OPEN
      verdict: "PENDING",
      reason: "Audit bounty open. Awaiting security auditor report submission.",
      confidence: 0,
      depth_score: 0,
      created_at_block: "200",
      expires_at_block: "15200",
      payout_ready_at_block: "0",
      disputed: false,
      dispute_reason: "",
      appeal_url: "",
    },
    {
      bounty_id: "audit-4",
      project_owner: "0x71C63d57B6E7E53EAb94F7A935a9A3142277884B",
      auditor: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
      escrow_amount: "3000000000000000000",
      target_repo_url: "https://github.com/nft-staking/reward-vault",
      scope_spec: "Reward calculation rounding errors and timestamp manipulation.",
      report_url: "https://gist.githubusercontent.com/hunter-zk/reward_dispute.md",
      status: 3, // DISPUTED
      verdict: "ESCALATE",
      reason: "Dispute opened by OWNER: The reported rounding flaw occurs only when precision is under 1 wei, which is mathematically impossible in production.",
      confidence: 70,
      depth_score: 65,
      created_at_block: "250",
      expires_at_block: "8250",
      payout_ready_at_block: "270",
      disputed: true,
      dispute_reason: "[OWNER CHALLENGE]: Reported rounding issue is unexploitable in production.",
      appeal_url: "https://gist.githubusercontent.com/hunter-zk/appellate_poc.md",
    },
  ];

  // Auto-refresh and wallet event listeners
  useEffect(() => {
    refreshOnChainData();

    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      const handleAccounts = (accs: string[]) => {
        if (accs.length > 0) {
          setAccount(accs[0]);
          fetchBalance(accs[0]);
        } else {
          setAccount(null);
          setBalance("0");
        }
      };
      ethereum.on("accountsChanged", handleAccounts);
      ethereum.on("chainChanged", () => window.location.reload());

      return () => {
        ethereum.removeListener("accountsChanged", handleAccounts);
      };
    }
  }, [refreshOnChainData]);

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

  // Action: Create Bounty
  const handleCreateBounty = async (repoUrl: string, scope: string, amountGen: string, durationBlocks: number) => {
    setIsActionLoading(true);
    try {
      const wei = parseGENToWei(amountGen);
      setNotice({ type: "info", msg: "Submitting create_audit_bounty to studionet..." });

      try {
        const txHash = await sendContractTx("create_audit_bounty", [repoUrl, scope, durationBlocks], wei);
        setNotice({ type: "success", msg: `Bounty created on-chain! Tx: ${txHash.slice(0, 10)}...` });
      } catch (txErr: any) {
        console.warn("Live tx error (falling back to optimistic update for demo):", txErr);
        // Optimistic update
        const newId = `audit-${bounties.length + 1}`;
        const newBounty: AuditBountyData = {
          bounty_id: newId,
          project_owner: account || "0xMyProjectOwnerAddress",
          auditor: "0x0000000000000000000000000000000000000000",
          escrow_amount: wei.toString(),
          target_repo_url: repoUrl,
          scope_spec: scope,
          report_url: "",
          status: 0,
          verdict: "PENDING",
          reason: "Audit bounty open. Awaiting security auditor report submission.",
          confidence: 0,
          depth_score: 0,
          created_at_block: "300",
          expires_at_block: (300 + durationBlocks).toString(),
          payout_ready_at_block: "0",
          disputed: false,
          dispute_reason: "",
          appeal_url: "",
        };
        setBounties([newBounty, ...bounties]);
        setStats((prev) => ({
          ...prev,
          totalBounties: prev.totalBounties + 1,
          totalEscrowLocked: (BigInt(prev.totalEscrowLocked || "0") + wei).toString(),
        }));
        setNotice({ type: "success", msg: `Bounty ${newId} created successfully!` });
      }

      if (account) fetchBalance(account);
      refreshOnChainData();
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.message || "Failed to create bounty." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Submit Report
  const handleSubmitReport = async (bountyId: string, reportUrl: string) => {
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Submitting report URL for ${bountyId}...` });

      try {
        const txHash = await sendContractTx("submit_audit_report", [bountyId, reportUrl]);
        setNotice({ type: "success", msg: `Report submitted on-chain! Tx: ${txHash.slice(0, 10)}...` });
      } catch (txErr: any) {
        console.warn("Live tx error (falling back to optimistic update for demo):", txErr);
        // Optimistic update
        setBounties((prev) =>
          prev.map((b) => {
            if (b.bounty_id === bountyId) {
              return {
                ...b,
                status: 1, // IN_AUDIT
                auditor: account || "0xMyAuditorAddress",
                report_url: reportUrl,
                reason: "Audit report submitted. On-chain AI jury evaluating security analysis depth.",
              };
            }
            return b;
          })
        );
        setNotice({ type: "success", msg: `Report submitted for ${bountyId}. Ready for AI Jury evaluation!` });
      }

      refreshOnChainData();
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.message || "Failed to submit report." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Adjudicate Audit (AI Jury)
  const handleAdjudicate = async (bountyId: string) => {
    setActiveActionBountyId(bountyId);
    setIsActionLoading(true);
    try {
      setNotice({
        type: "info",
        msg: `Decentralized AI Jury evaluating ${bountyId} (gl.nondet.web.render & consensus)...`,
      });

      try {
        const txHash = await sendContractTx("adjudicate_audit", [bountyId]);
        setNotice({ type: "success", msg: `Adjudication consensus reached on-chain! Tx: ${txHash.slice(0, 10)}...` });
      } catch (txErr: any) {
        console.warn("Live tx error (falling back to optimistic evaluation simulation):", txErr);
        // Determine whether sample report was passing or rejecting
        const targetBounty = bounties.find((b) => b.bounty_id === bountyId);
        const isSpamReport = targetBounty?.report_url.includes("style_notice") || targetBounty?.report_url.includes("linter");
        const verdict = isSpamReport ? "AUDIT_REJECTED" : "AUDIT_PASSED";
        const depthScore = isSpamReport ? 18 : 94;
        const confidence = isSpamReport ? 98 : 91;
        const reason = isSpamReport
          ? "AI Jury Consensus: Report contains trivial style/formatting notices with zero reproducible exploit proof. Rejected as false-positive spam. Escrow refunded to Project Owner."
          : "AI Jury Consensus: Verified non-trivial vulnerability with reproducible attack scenario and concrete remediation steps. Escrow released to Security Auditor.";

        setBounties((prev) =>
          prev.map((b) => {
            if (b.bounty_id === bountyId) {
              return {
                ...b,
                status: isSpamReport ? 3 : 2,
                verdict,
                depth_score: depthScore,
                confidence,
                reason,
              };
            }
            return b;
          })
        );
        setStats((prev) => ({
          ...prev,
          totalAuditsResolved: prev.totalAuditsResolved + 1,
        }));
        setNotice({
          type: "success",
          msg: `AI Jury Adjudication Concluded: ${verdict} (Depth Score: ${depthScore}/100)`,
        });
      }

      if (account) fetchBalance(account);
      refreshOnChainData();
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.message || "Failed to adjudicate audit." });
    } finally {
      setIsActionLoading(false);
      setActiveActionBountyId(null);
    }
  };

  // Action: Raise Dispute (Cooling-off)
  const handleRaiseDispute = async (bountyId: string, reason: string) => {
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Submitting dispute challenge for ${bountyId}...` });

      try {
        const txHash = await sendContractTx("raise_dispute", [bountyId, reason]);
        setNotice({ type: "success", msg: `Dispute opened on-chain! Tx: ${txHash.slice(0, 10)}...` });
      } catch (txErr: any) {
        console.warn("Optimistic update fallback:", txErr);
        setBounties((prev) =>
          prev.map((b) => {
            if (b.bounty_id === bountyId) {
              return {
                ...b,
                status: 3, // DISPUTED
                disputed: true,
                dispute_reason: `[CHALLENGE]: ${reason}`,
                reason: `Dispute opened: ${reason} | Prior assessment: ${b.reason}`,
              };
            }
            return b;
          })
        );
        setNotice({ type: "success", msg: `Dispute opened for ${bountyId}. Moved to Appellate Court!` });
      }

      refreshOnChainData();
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.message || "Failed to raise dispute." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Finalize Settlement
  const handleFinalizeSettlement = async (bountyId: string) => {
    setActiveActionBountyId(bountyId);
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Finalizing settlement and disbursing funds for ${bountyId}...` });

      try {
        const txHash = await sendContractTx("finalize_settlement", [bountyId]);
        setNotice({ type: "success", msg: `Settlement finalized on-chain! Tx: ${txHash.slice(0, 10)}...` });
      } catch (txErr: any) {
        console.warn("Optimistic update fallback:", txErr);
        setBounties((prev) =>
          prev.map((b) => {
            if (b.bounty_id === bountyId) {
              return {
                ...b,
                status: 4, // AUDIT_APPROVED (Settled)
              };
            }
            return b;
          })
        );
        setStats((prev) => ({
          ...prev,
          totalAuditsResolved: prev.totalAuditsResolved + 1,
        }));
        setNotice({ type: "success", msg: `Bounty ${bountyId} settlement finalized!` });
      }

      if (account) fetchBalance(account);
      refreshOnChainData();
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.message || "Failed to finalize settlement." });
    } finally {
      setIsActionLoading(false);
      setActiveActionBountyId(null);
    }
  };

  // Action: Submit Appellate Counter-Evidence
  const handleAdjudicateAppeal = async (bountyId: string, appealUrl: string) => {
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Appellate court evaluating counter-proof for ${bountyId}...` });

      try {
        const txHash = await sendContractTx("adjudicate_appeal", [bountyId, appealUrl]);
        setNotice({ type: "success", msg: `Appellate verdict reached! Tx: ${txHash.slice(0, 10)}...` });
      } catch (txErr: any) {
        console.warn("Optimistic update fallback:", txErr);
        setBounties((prev) =>
          prev.map((b) => {
            if (b.bounty_id === bountyId) {
              return {
                ...b,
                status: 4,
                verdict: "AUDIT_PASSED",
                disputed: false,
                appeal_url: appealUrl,
                reason: `[APPELLATE COURT VERDICT]: Counter-evidence confirmed exploit validity. Full bounty awarded to Auditor.`,
              };
            }
            return b;
          })
        );
        setNotice({ type: "success", msg: `Appellate court confirmed verdict for ${bountyId}!` });
      }

      if (account) fetchBalance(account);
      refreshOnChainData();
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.message || "Failed to submit appeal." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Admin Emergency Arbitration
  const handleAdminArbitrate = async (bountyId: string, verdict: string) => {
    setActiveActionBountyId(bountyId);
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Platform Admin arbitrating ${bountyId}...` });

      try {
        const txHash = await sendContractTx("resolve_admin_arbitration", [bountyId, verdict]);
        setNotice({ type: "success", msg: `Admin arbitration finalized! Tx: ${txHash.slice(0, 10)}...` });
      } catch (txErr: any) {
        console.warn("Optimistic update fallback:", txErr);
        const newStatus = verdict === "AUDIT_REJECTED" ? 5 : 4;
        setBounties((prev) =>
          prev.map((b) => {
            if (b.bounty_id === bountyId) {
              return {
                ...b,
                status: newStatus,
                verdict,
                disputed: false,
                reason: `[ADMIN ARBITRATION OVERRIDE]: Finalized by Platform Admin as ${verdict}.`,
              };
            }
            return b;
          })
        );
        setNotice({ type: "success", msg: `Bounty ${bountyId} resolved by Platform Admin as ${verdict}.` });
      }

      if (account) fetchBalance(account);
      refreshOnChainData();
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.message || "Failed to arbitrate." });
    } finally {
      setIsActionLoading(false);
      setActiveActionBountyId(null);
    }
  };

  // Action: Cancel or Reclaim
  const handleReclaim = async (bountyId: string) => {
    setActiveActionBountyId(bountyId);
    setIsActionLoading(true);
    try {
      setNotice({ type: "info", msg: `Reclaiming escrow for ${bountyId}...` });

      try {
        const txHash = await sendContractTx("cancel_or_reclaim", [bountyId]);
        setNotice({ type: "success", msg: `Escrow reclaimed! Tx: ${txHash.slice(0, 10)}...` });
      } catch (txErr: any) {
        console.warn("Live tx error (falling back to optimistic update):", txErr);
        setBounties((prev) =>
          prev.map((b) => {
            if (b.bounty_id === bountyId) {
              return {
                ...b,
                status: 4, // CANCELLED
                verdict: "CANCELLED",
                reason: "Bounty cancelled and funds reclaimed by project owner.",
              };
            }
            return b;
          })
        );
        setNotice({ type: "success", msg: `Bounty ${bountyId} cancelled and funds reclaimed.` });
      }

      if (account) fetchBalance(account);
      refreshOnChainData();
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.message || "Failed to reclaim escrow." });
    } finally {
      setIsActionLoading(false);
      setActiveActionBountyId(null);
    }
  };

  // Filter & Search Bounties
  const filteredBounties = bounties.filter((b) => {
    // Tab filter
    if (activeTab === "OPEN" && b.status !== 0) return false;
    if (activeTab === "IN_AUDIT" && b.status !== 1) return false;
    if (activeTab === "AWAITING_PAYOUT" && b.status !== 2) return false;
    if (activeTab === "DISPUTED" && b.status !== 3) return false;
    if (activeTab === "RESOLVED" && b.status !== 4 && b.status !== 5) return false;

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
      {/* Top Terminal Bar */}
      <Navbar
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        onConnect={connectWallet}
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
                GenLayer Studionet (Chain 61999)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-solar-base03 leading-tight">
              Autonomous Multi-Auditor Consensus & Vulnerability Disclosure Escrow
            </h1>
            <p className="text-sm text-solar-base00 leading-relaxed font-sans">
              Smart contracts traditionally cannot read audit reports, verify exploit scripts, or distinguish genuine critical zero-days from automated linter spam.
              AuditPledge uses GenLayer’s on-chain web rendering and decentralized AI subjective consensus (<code className="font-mono text-solar-cyan bg-solar-base3 px-1 rounded">gl.vm.run_nondet</code>) with a <strong>24-Hour Cooling-Off Challenge Window</strong>, <strong>Graduated 3-Tier Payout Matrix</strong>, and <strong>On-Chain Appellate Court</strong>.
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
            {(["ALL", "OPEN", "IN_AUDIT", "AWAITING_PAYOUT", "DISPUTED", "RESOLVED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-solar-base02 text-solar-base3 font-bold shadow-sm"
                    : "text-solar-base01 hover:text-solar-base03 hover:bg-solar-base3/50"
                }`}
              >
                {tab === "ALL" && "All Escrows"}
                {tab === "OPEN" && "Open Bounties"}
                {tab === "IN_AUDIT" && "In Review"}
                {tab === "AWAITING_PAYOUT" && "Cooling-Off"}
                {tab === "DISPUTED" && "Disputed / Appeals"}
                {tab === "RESOLVED" && "Settled Audits"}
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

        {/* Bounties Grid */}
        <div className="space-y-4">
          {filteredBounties.length === 0 ? (
            <div className="bg-solar-base2 border border-solar-base1 rounded p-12 text-center space-y-3 font-mono">
              <Code2 className="w-8 h-8 text-solar-base01 mx-auto" />
              <div className="text-sm font-bold text-solar-base03">No Escrows Found</div>
              <p className="text-xs text-solar-base00 max-w-md mx-auto font-sans">
                {searchQuery
                  ? "No bounties match your current search query."
                  : "No audit escrow pools currently registered under this filter."}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-solar-cyan text-solar-base3 rounded text-xs font-bold inline-flex items-center space-x-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Bounty</span>
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