# Project Explorer Application — AuditPledge

### 1. Make it recognizable
- **Logo File**: `logo.png` (or `logo.jpg`) — Saved directly in project root folder (`c:\Users\Admin\Documents\genlayer\AuditPledge\logo.png`)
- **PROJECT NAME**:
  ```text
  AuditPledge
  ```
- **PRIMARY TAG**:
  ```text
  Dispute Resolution
  ```
  *(Alternative: `AI & Agents`)*

---

### 2. Project Summary: One-liner
**DESCRIBE THE PROJECT IN ONE LINE**:
```text
Autonomous vulnerability disclosure escrow powered by GenLayer AI multi-validator consensus and bilateral dispute arbitration.
```

---

### 3. Project Overview: Description
**WHAT IS THIS PROJECT? (928 / 1000 characters)**:
```text
AuditPledge is an autonomous vulnerability disclosure escrow and dispute resolution protocol powered by GenLayer's decentralized AI multi-validator consensus (gl.vm.run_nondet).

Traditional bug bounties suffer from subjective dispute deadlocks, unpaid whitehat research, and linter spam. AuditPledge solves this with a trustless, symmetrical security operations escrow:
• Autonomous AI Consensus: Validators dynamically inspect code invariants, sandboxed PoCs, and CVSS severity.
• Symmetrical 20-Block Cooling-Off: Both parties have a challenge window before fund disbursement.
• Anti-Griefing 10% Dispute Bond: Whistleblowers and owners can appeal rejections to the On-Chain Appellate Security Court. Valid claims receive full bond reimbursement plus graduated payouts (100% Critical / 40% Partial / 0% Reject), ensuring neither side is exploited.
• Canary Token Defense: Hardened against prompt injection and LLM jailbreaks.
```

---

### 4. Links & Deployment Details (If requested in subsequent steps)
- **Live dApp**: https://auditpledge.vercel.app
- **GitHub**: https://github.com/tuannguyen1995/AuditPledge
- **Contract Address (StudioNet - Production v2.1)**: `0xb839b5c0f98f6Cf8B56049C7890265703aA77528`
- **Network**: GenLayer StudioNet (Chain ID: 61999)
- **Architecture Highlights (Remediated v2)**:
  1. Immutable Code Revision Binding (`commit_hash` >= 7 chars & `code_url`).
  2. Live Source Code Injected into Validator Prompts across both adjudication paths (`adjudicate_audit` & `adjudicate_appeal`).
  3. 100% Protocol Autonomy: Zero admin override backdoors (`resolve_admin_arbitration` removed).
  4. Restricted Appeal & Settlement: Appeal evidence bound strictly to appellant staking 10% bond; settlement restricted to intended parties (`project_owner` / `auditor`).
