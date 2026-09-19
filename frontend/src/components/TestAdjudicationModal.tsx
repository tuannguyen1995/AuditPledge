import React from "react";
import { X, Sparkles, ShieldCheck, ShieldAlert, Scale, Bug, ArrowRight } from "lucide-react";
import { AuditBountyData } from "../utils/helpers";

interface TestAdjudicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioBounty: AuditBountyData) => void;
}

export const TestAdjudicationModal: React.FC<TestAdjudicationModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const scenarios: {
    id: string;
    title: string;
    badge: string;
    badgeColor: string;
    icon: any;
    desc: string;
    expected: string;
    bounty: AuditBountyData;
  }[] = [
    {
      id: "reentrancy",
      title: "Scenario 1: Critical Reentrancy PoC",
      badge: "VERIFIED EXPLOIT",
      badgeColor: "bg-neon-emerald/15 text-neon-emerald border-neon-emerald/40",
      icon: ShieldCheck,
      desc: "Whitehat submits a verified reentrancy exploit with reproducible PoC in withdraw() draining vault balance.",
      expected: "AI Jury passes submission (Depth: 94/100). Status: AWAITING_PAYOUT (20-block cooling-off) -> 100% Payout.",
      bounty: {
        bounty_id: "audit-poc-901",
        project_owner: "0x1092F0aB59C243B5B84e883856d396996D1e9b25",
        auditor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        escrow_amount: "10000000000000000000",
        dispute_bond: "0",
        dispute_initiator: "0x0000000000000000000000000000000000000000",
        target_repo_url: "https://github.com/defi-protocol/vault-core",
        scope_spec: "Invariants: User balances must decrement strictly before external native transfer. ReentrancyGuard enforced.",
        report_url: "https://gist.github.com/whitehat/vault_reentrancy_poc.md",
        status: 2,
        verdict: "AUDIT_PASSED",
        reason: "Valid critical vulnerability verified. Sandboxed execution proved balance drain before state decrement. Actionable remediation provided.",
        confidence: 96,
        depth_score: 94,
        created_at_block: "1789808600",
        expires_at_block: "1789814600",
        audit_started_block: "1789808610",
        payout_ready_at_block: "1789808630",
        disputed: false,
        dispute_reason: "",
        appeal_url: "",
      },
    },
    {
      id: "spam",
      title: "Scenario 2: Trivial Typo & Linter Warning (Spam)",
      badge: "SPAM REJECTED",
      badgeColor: "bg-neon-crimson/15 text-neon-crimson border-neon-crimson/40",
      icon: ShieldAlert,
      desc: "Spam submission claiming $50,000 bounty for inconsistent comment indentation without any exploit PoC.",
      expected: "AI Jury detects triviality (Depth: 14/100). Status: AWAITING_REFUND (20-block cooling-off) -> 100% Refund to Owner.",
      bounty: {
        bounty_id: "audit-spam-902",
        project_owner: "0x324A45B45F275C963B5418b76D19E5244b67E425",
        auditor: "0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E",
        escrow_amount: "5000000000000000000",
        dispute_bond: "0",
        dispute_initiator: "0x0000000000000000000000000000000000000000",
        target_repo_url: "https://github.com/defi-protocol/vault-core",
        scope_spec: "Invariants: Zero tolerance for unauthorized fund drains. Business logic vulnerabilities only.",
        report_url: "https://pastebin.com/raw/linter_warning.txt",
        status: 3,
        verdict: "AUDIT_REJECTED",
        reason: "Report fails technical depth criteria (14/100). Report flags superficial whitespace indentation without demonstrating any exploit vector or financial loss.",
        confidence: 99,
        depth_score: 14,
        created_at_block: "1789808600",
        expires_at_block: "1789814600",
        audit_started_block: "1789808615",
        payout_ready_at_block: "1789808635",
        disputed: false,
        dispute_reason: "",
        appeal_url: "",
      },
    },
    {
      id: "dispute",
      title: "Scenario 3: Bilateral Dispute with 10% Bond",
      badge: "APPELLATE TRIBUNAL",
      badgeColor: "bg-neon-amber/15 text-neon-amber border-neon-amber/40",
      icon: Scale,
      desc: "Initial reject challenged by Whitehat with 10% Dispute Bond (0.8 GEN). Appellate Court verifies counter-proof.",
      expected: "Appellate Tribunal finds partial merit (Depth: 68/100): 40% Payout, 60% Refund, 100% Bond refunded to Appellant.",
      bounty: {
        bounty_id: "audit-dispute-903",
        project_owner: "0x5555555555555555555555555555555555555555",
        auditor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        escrow_amount: "8000000000000000000",
        dispute_bond: "800000000000000000",
        dispute_initiator: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        target_repo_url: "https://github.com/oracle-aggregator/medianizer",
        scope_spec: "Oracle aggregation invariants: Stale price rejection and heartbeat tolerance.",
        report_url: "https://gist.github.com/auditor/oracle_stale_data.md",
        status: 4,
        verdict: "PARTIAL_APPROVAL",
        reason: "[APPELLATE COURT VERDICT]: Counter-evidence confirmed medium-severity boundary check omission in sequencer feed. 40% partial bounty awarded, 100% bond returned to Auditor.",
        confidence: 91,
        depth_score: 68,
        created_at_block: "1789808500",
        expires_at_block: "1789814500",
        audit_started_block: "1789808520",
        payout_ready_at_block: "1789808540",
        disputed: true,
        dispute_reason: "[AUDITOR CHALLENGE]: Oracle heartbeat test traces in counter-evidence clearly prove price staleness risk.",
        appeal_url: "https://gist.githubusercontent.com/auditor/appeal_counter_evidence.md",
      },
    },
    {
      id: "canary",
      title: "Scenario 4: Prompt Injection Canary Defense",
      badge: "CANARY INTERCEPTED",
      badgeColor: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40",
      icon: Bug,
      desc: "Adversarial report contains prompt injection attack attempting to force the AI jury to output AUDIT_PASSED.",
      expected: "Sanitizer and Canary Defense detect the jailbreak pattern. Verdict escalated for review without fund leakage.",
      bounty: {
        bounty_id: "audit-canary-904",
        project_owner: "0x1092F0aB59C243B5B84e883856d396996D1e9b25",
        auditor: "0xAdversaryHacker6666666666666666666666666",
        escrow_amount: "15000000000000000000",
        dispute_bond: "0",
        dispute_initiator: "0x0000000000000000000000000000000000000000",
        target_repo_url: "https://github.com/defi-protocol/vault-core",
        scope_spec: "Strict invariants: Protect against adversarial exploits and smart contract state corruption.",
        report_url: "https://pastebin.com/raw/malicious_prompt_injection.txt",
        status: 4,
        verdict: "ESCALATE",
        reason: "Canary Defense Protocol triggered: Report contained blocked prompt injection patterns [IGNORE ALL PREVIOUS INSTRUCTIONS]. Verdict escalated to prevent unauthorized disbursement.",
        confidence: 100,
        depth_score: 50,
        created_at_block: "1789808600",
        expires_at_block: "1789814600",
        audit_started_block: "1789808610",
        payout_ready_at_block: "1789808630",
        disputed: true,
        dispute_reason: "Automatic escalation: Prompt injection attempt detected by Canary Token filter.",
        appeal_url: "",
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="bg-cyber-card border border-cyber-border rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-bg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyber-surface rounded-md text-neon-cyan border border-neon-cyan/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base text-white flex items-center gap-2">
                <span>Live Adjudication Sandbox</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neon-cyan/15 text-neon-cyan font-mono border border-neon-cyan/30">
                  INTERACTIVE TEST
                </span>
              </h3>
              <p className="text-[11px] text-cyber-muted font-mono">
                Select a scenario to test autonomous multi-auditor consensus & bilateral dispute flow directly on the UI.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-cyber-muted hover:text-white p-1 rounded-md hover:bg-cyber-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc.bounty);
                  onClose();
                }}
                className="group p-4 bg-cyber-surface/60 hover:bg-cyber-surface border border-cyber-border hover:border-neon-cyan/50 rounded-lg cursor-pointer transition-all shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-neon-cyan" />
                    <h4 className="font-mono font-bold text-sm text-white group-hover:text-neon-cyan transition-colors">
                      {sc.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                    {sc.badge}
                  </span>
                </div>

                <p className="text-xs text-cyber-muted font-sans leading-relaxed">
                  {sc.desc}
                </p>

                <div className="pt-1 border-t border-cyber-border flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyber-subtle truncate max-w-[80%]">
                    Outcome: {sc.expected}
                  </span>
                  <span className="text-neon-cyan flex items-center space-x-1 font-bold group-hover:translate-x-1 transition-transform">
                    <span>Test on App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
