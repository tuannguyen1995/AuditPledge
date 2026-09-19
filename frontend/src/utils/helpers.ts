export interface AuditBountyData {
  bounty_id: string;
  project_owner: string;
  auditor: string;
  escrow_amount: string;
  target_repo_url: string;
  scope_spec: string;
  report_url: string;
  // Symmetrical Mutually-Protected Status Lifecycle:
  // 0: OPEN
  // 1: IN_AUDIT
  // 2: AWAITING_PAYOUT (Provisional Pass: Owner 20-block cooling-off challenge window)
  // 3: AWAITING_REFUND (Provisional Reject: Auditor 20-block cooling-off challenge window)
  // 4: DISPUTED (Active Appellate Court review: both parties protected)
  // 5: AUDIT_APPROVED (Settled: 100% or 40% disbursed to Auditor)
  // 6: AUDIT_REJECTED (Settled: 100% refunded to Project Owner)
  // 7: CANCELLED (Reclaimed by Project Owner)
  status: number;
  verdict: string; // "PENDING", "AUDIT_PASSED", "PARTIAL_APPROVAL", "AUDIT_REJECTED", "ESCALATE", "CANCELLED"
  reason: string;
  confidence: number;
  depth_score: number;
  created_at_block: string;
  expires_at_block: string;
  audit_started_block?: string;
  payout_ready_at_block: string;
  disputed: boolean;
  dispute_reason: string;
  appeal_url: string;
  dispute_bond?: string;
}

export function shortenAddress(addr: string, chars = 4): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "Unassigned";
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}

export function formatGEN(valStr: string | bigint | number): string {
  try {
    const raw = typeof valStr === "bigint" ? valStr : BigInt(valStr || "0");
    const num = Number(raw) / 1e18;
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }) + " GEN";
  } catch {
    return "0 GEN";
  }
}

export function parseGENToWei(amountStr: string): bigint {
  try {
    const clean = amountStr.trim();
    if (!clean || isNaN(Number(clean))) return BigInt(0);
    const parts = clean.split(".");
    const whole = parts[0] || "0";
    let fraction = parts[1] || "";
    if (fraction.length > 18) {
      fraction = fraction.slice(0, 18);
    } else {
      fraction = fraction.padEnd(18, "0");
    }
    return BigInt(whole) * BigInt(10 ** 18) + BigInt(fraction);
  } catch {
    return BigInt(0);
  }
}

export function getStatusBadge(status: number): { label: string; bg: string; text: string; border: string; desc: string; glow: string } {
  switch (status) {
    case 0:
      return {
        label: "OPEN ESCROW",
        bg: "bg-neon-cyan/10",
        text: "text-neon-cyan",
        border: "border-neon-cyan/40",
        desc: "Awaiting Whitehat Auditor PoC submission",
        glow: "cyber-glow-cyan",
      };
    case 1:
      return {
        label: "AI JURY REVIEW",
        bg: "bg-neon-amber/10",
        text: "text-neon-amber",
        border: "border-neon-amber/40",
        desc: "Report submitted; ready for AI Jury consensus",
        glow: "cyber-glow-amber",
      };
    case 2:
      return {
        label: "COOLING-OFF (PASS)",
        bg: "bg-neon-amber/15",
        text: "text-neon-amber",
        border: "border-neon-amber",
        desc: "Provisional Pass: Owner 20-block challenge window",
        glow: "cyber-glow-amber",
      };
    case 3:
      return {
        label: "COOLING-OFF (REJECT)",
        bg: "bg-neon-amber/15",
        text: "text-neon-amber",
        border: "border-neon-amber",
        desc: "Provisional Reject: Auditor 20-block challenge window",
        glow: "cyber-glow-amber",
      };
    case 4:
      return {
        label: "TRIBUNAL DISPUTED",
        bg: "bg-neon-crimson/15",
        text: "text-neon-crimson",
        border: "border-neon-crimson",
        desc: "Active dispute: In Appellate Security Court",
        glow: "cyber-glow-crimson",
      };
    case 5:
      return {
        label: "AUDIT APPROVED",
        bg: "bg-neon-emerald/15",
        text: "text-neon-emerald",
        border: "border-neon-emerald",
        desc: "Settled: Bounty disbursed to auditor",
        glow: "cyber-glow-emerald",
      };
    case 6:
      return {
        label: "AUDIT REJECTED",
        bg: "bg-cyber-surface",
        text: "text-cyber-muted",
        border: "border-cyber-border",
        desc: "Settled: 100% Escrow refunded to project owner",
        glow: "",
      };
    case 7:
      return {
        label: "CANCELLED",
        bg: "bg-cyber-surface",
        text: "text-cyber-subtle",
        border: "border-cyber-border",
        desc: "Bounty cancelled and reclaimed by owner",
        glow: "",
      };
    default:
      return {
        label: "UNKNOWN",
        bg: "bg-cyber-surface",
        text: "text-cyber-subtle",
        border: "border-cyber-border",
        desc: "Unknown status",
        glow: "",
      };
  }
}

export function getVerdictDisplay(verdict: string): { label: string; text: string; bg: string; border: string; payoutRatio: string; severityTag: string } {
  const v = (verdict || "").toUpperCase().trim();
  if (v === "AUDIT_PASSED") {
    return {
      label: "CRITICAL SEVERITY VERIFIED (100% Payout)",
      text: "text-neon-emerald",
      bg: "bg-neon-emerald/10",
      border: "border-neon-emerald/40",
      payoutRatio: "100% Auditor / 0% Owner",
      severityTag: "CRITICAL (CVSS 9.0 - 10.0)",
    };
  }
  if (v === "PARTIAL_APPROVAL") {
    return {
      label: "MEDIUM SEVERITY VERIFIED (40% Payout)",
      text: "text-neon-amber",
      bg: "bg-neon-amber/10",
      border: "border-neon-amber/40",
      payoutRatio: "40% Auditor / 60% Refunded to Owner",
      severityTag: "MEDIUM (CVSS 4.0 - 6.9)",
    };
  }
  if (v === "AUDIT_REJECTED") {
    return {
      label: "INVALID / FALSE POSITIVE (0% Payout)",
      text: "text-neon-crimson",
      bg: "bg-neon-crimson/10",
      border: "border-neon-crimson/40",
      payoutRatio: "0% Auditor / 100% Refunded to Owner",
      severityTag: "REJECTED (LINTER SPAM / UNVERIFIED)",
    };
  }
  if (v === "ESCALATE") {
    return {
      label: "ESCALATED TO APPELLATE COURT",
      text: "text-neon-cyan",
      bg: "bg-neon-cyan/10",
      border: "border-neon-cyan/40",
      payoutRatio: "Awaiting Appellate Consensus",
      severityTag: "ESCALATED FOR COURT REVIEW",
    };
  }
  if (v === "CANCELLED") {
    return {
      label: "CANCELLED",
      text: "text-cyber-subtle",
      bg: "bg-cyber-surface",
      border: "border-cyber-border",
      payoutRatio: "100% Reclaimed by Owner",
      severityTag: "TERMINATED",
    };
  }
  return {
    label: "PENDING AI CONSENSUS",
    text: "text-neon-cyan",
    bg: "bg-neon-cyan/10",
    border: "border-neon-cyan/40",
    payoutRatio: "Locked in Escrow",
    severityTag: "AWAITING TRIAGING",
  };
}