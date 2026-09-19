export interface AuditBountyData {
  bounty_id: string;
  project_owner: string;
  auditor: string;
  escrow_amount: string;
  target_repo_url: string;
  scope_spec: string;
  report_url: string;
  // Status:
  // 0: OPEN, 1: IN_AUDIT, 2: AWAITING_PAYOUT, 3: DISPUTED,
  // 4: AUDIT_APPROVED (Settled), 5: AUDIT_REJECTED (Settled), 6: CANCELLED
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
}

export function shortenAddress(addr: string, chars = 4): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "None (Unassigned)";
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

export function getStatusBadge(status: number): { label: string; bg: string; text: string; border: string; desc: string } {
  switch (status) {
    case 0:
      return {
        label: "OPEN",
        bg: "bg-solar-cyan/10",
        text: "text-solar-cyan",
        border: "border-solar-cyan",
        desc: "Awaiting Auditor PoC submission",
      };
    case 1:
      return {
        label: "IN AUDIT",
        bg: "bg-solar-yellow/10",
        text: "text-solar-yellow",
        border: "border-solar-yellow",
        desc: "Report submitted; ready for AI Jury adjudication",
      };
    case 2:
      return {
        label: "AWAITING PAYOUT",
        bg: "bg-solar-orange/15",
        text: "text-solar-orange",
        border: "border-solar-orange",
        desc: "Cooling-Off Period: Parties may challenge or dispute verdict",
      };
    case 3:
      return {
        label: "DISPUTED",
        bg: "bg-solar-red/15",
        text: "text-solar-red",
        border: "border-solar-red",
        desc: "Active dispute: Awaiting appellate evidence or arbitration",
      };
    case 4:
      return {
        label: "AUDIT APPROVED",
        bg: "bg-solar-green/15",
        text: "text-solar-green",
        border: "border-solar-green",
        desc: "Settled: Bounty funds disbursed to auditor",
      };
    case 5:
      return {
        label: "AUDIT REJECTED",
        bg: "bg-solar-base01/15",
        text: "text-solar-base01",
        border: "border-solar-base01",
        desc: "Settled: Escrow refunded back to project owner",
      };
    case 6:
      return {
        label: "CANCELLED",
        bg: "bg-solar-base01/10",
        text: "text-solar-base01",
        border: "border-solar-base01",
        desc: "Bounty cancelled and reclaimed by owner",
      };
    default:
      return {
        label: "UNKNOWN",
        bg: "bg-solar-base2",
        text: "text-solar-base00",
        border: "border-solar-base1",
        desc: "Unknown status",
      };
  }
}

export function getVerdictDisplay(verdict: string): { label: string; text: string; bg: string; border: string; payoutRatio: string } {
  const v = (verdict || "").toUpperCase().trim();
  if (v === "AUDIT_PASSED") {
    return {
      label: "AUDIT PASSED (100% Payout)",
      text: "text-solar-green",
      bg: "bg-solar-green/15",
      border: "border-solar-green",
      payoutRatio: "100% Auditor / 0% Owner",
    };
  }
  if (v === "PARTIAL_APPROVAL") {
    return {
      label: "PARTIAL APPROVAL (40% Payout)",
      text: "text-solar-yellow",
      bg: "bg-solar-yellow/15",
      border: "border-solar-yellow",
      payoutRatio: "40% Auditor / 60% Refunded to Owner",
    };
  }
  if (v === "AUDIT_REJECTED") {
    return {
      label: "AUDIT REJECTED (0% Payout)",
      text: "text-solar-red",
      bg: "bg-solar-red/15",
      border: "border-solar-red",
      payoutRatio: "0% Auditor / 100% Refunded to Owner",
    };
  }
  if (v === "ESCALATE") {
    return {
      label: "ESCALATED TO APPELLATE COURT",
      text: "text-solar-orange",
      bg: "bg-solar-orange/15",
      border: "border-solar-orange",
      payoutRatio: "Appellate evaluation required",
    };
  }
  if (v === "CANCELLED") {
    return {
      label: "CANCELLED",
      text: "text-solar-base01",
      bg: "bg-solar-base01/15",
      border: "border-solar-base01",
      payoutRatio: "100% Reclaimed by Owner",
    };
  }
  return {
    label: "PENDING REVIEW",
    text: "text-solar-cyan",
    bg: "bg-solar-cyan/15",
    border: "border-solar-cyan",
    payoutRatio: "Locked in Escrow",
  };
}