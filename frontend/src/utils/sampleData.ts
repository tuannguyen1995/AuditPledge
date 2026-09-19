export interface DemoPreset {
  name: string;
  repoUrl: string;
  scope: string;
  amount: string;
  duration: number;
}

export interface DemoReport {
  title: string;
  type: "PASSING" | "REJECTING";
  url: string;
  description: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    name: "DeFi Autonomous Lending Vault",
    repoUrl: "https://github.com/defi-vault/autonomous-yield",
    scope: "Critical invariants: Solvency under liquidation cascades, state updates before flash loan external calls, invariant protection on deposit/redeem ratios.",
    amount: "2.5",
    duration: 6000,
  },
  {
    name: "AI Agent Escrow Settlement Engine",
    repoUrl: "https://github.com/agentic-economy/escrow-hub",
    scope: "Target: Multi-sig arbitration, reentrancy guards on automated agent release, denial of service checks on unbounded loop iterations.",
    amount: "5.0",
    duration: 10000,
  },
  {
    name: "Cross-Chain Oracle Attestation Bridge",
    repoUrl: "https://github.com/oracle-bridge/light-client",
    scope: "Target: Validator signature verification, replay attack prevention with unique nonces, slippage tolerances during price feed disputes.",
    amount: "10.0",
    duration: 15000,
  },
];

export const DEMO_REPORTS: DemoReport[] = [
  {
    title: "High-Severity Reentrancy Finding with Exploit PoC",
    type: "PASSING",
    url: "https://gist.githubusercontent.com/auditor-pro/8f3a6b7e/raw/reentrancy_poc.md",
    description: "Detailed vulnerability analysis with verified Solidity reproduction script and recommended OpenZeppelin ReentrancyGuard remediation. (Expected: AUDIT_PASSED, Depth ~95%)",
  },
  {
    title: "Automated Linter Spam / Trivial Typo Notice",
    type: "REJECTING",
    url: "https://gist.githubusercontent.com/linter-bot/99a2c1d/raw/style_notice.md",
    description: "Generic automated tool scan flagging indentation and variable naming without any demonstrable exploit. (Expected: AUDIT_REJECTED, Depth ~15%)",
  },
];