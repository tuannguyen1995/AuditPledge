export interface DemoPreset {
  name: string;
  repoUrl: string;
  commitHash: string;
  codeUrl: string;
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
    commitHash: "cad46920be2ac34ad42e5ee237cbf1706ccee6c7",
    codeUrl: "https://raw.githubusercontent.com/tuannguyenvan95/vulnerability-zero-genlayer/cad46920be2ac34ad42e5ee237cbf1706ccee6c7/contracts/VulnerabilityZero.py",
    scope: "Critical invariants: Solvency under liquidation cascades, state updates before flash loan external calls, invariant protection on deposit/redeem ratios.",
    amount: "2.5",
    duration: 6000,
  },
  {
    name: "AI Agent Escrow Settlement Engine",
    repoUrl: "https://github.com/agentic-economy/escrow-hub",
    commitHash: "e8f4a1c0d5b6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
    codeUrl: "https://raw.githubusercontent.com/agentic-economy/escrow-hub/e8f4a1c0d5b6e7f8a9b0c1d2e3f4a5b6c7d8e9f0/contracts/AgentEscrow.sol",
    scope: "Target: Multi-sig arbitration, reentrancy guards on automated agent release, denial of service checks on unbounded loop iterations.",
    amount: "5.0",
    duration: 10000,
  },
  {
    name: "Cross-Chain Oracle Attestation Bridge",
    repoUrl: "https://github.com/oracle-bridge/light-client",
    commitHash: "9a2f1c8b7d6e5a4f3c2b1a0e9f8d7c6b5a4e3d2c",
    codeUrl: "https://raw.githubusercontent.com/oracle-bridge/light-client/9a2f1c8b7d6e5a4f3c2b1a0e9f8d7c6b5a4e3d2c/contracts/OracleBridge.sol",
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