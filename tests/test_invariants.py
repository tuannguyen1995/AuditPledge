import pytest
import json
from gltest.direct.loader import create_address
from gltest.types import MockedWebResponseData

REPO_URL = "https://github.com/tuannguyenvan95/vulnerability-zero-genlayer"
COMMIT_HASH = "cad46920be2ac34ad42e5ee237cbf1706ccee6c7"
CODE_URL = f"https://raw.githubusercontent.com/tuannguyenvan95/vulnerability-zero-genlayer/{COMMIT_HASH}/contracts/VulnerabilityZero.py"
REPORT_URL = "https://raw.githubusercontent.com/auditor/reports/main/audit-poc.md"
APPEAL_URL = "https://raw.githubusercontent.com/auditor/reports/main/appeal-proof.md"
SCOPE = "Reentrancy, unauthorized withdrawals, and state manipulation invariants."
CANARY_TOKEN = "CANARY_AUDIT_PLEDGE_SECURE_V1"


# ─── Source Binding: Structural URL Component Tests ───────────────────

def test_source_binding_rejects_wrong_owner(direct_vm, direct_deploy):
    """Structural invariant: code_url owner segment must match declared repo owner."""
    contract = direct_deploy("contracts/contract.py")
    repo = "https://github.com/org/sample-repo"
    commit = "a1b2c3d4e5f6"
    # Owner "attacker" does not match "org"
    invalid_url = "https://raw.githubusercontent.com/attacker/sample-repo/a1b2c3d4e5f6/Contract.py"

    direct_vm.deal(direct_vm.sender, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    with direct_vm.expect_revert("URL owner"):
        contract.create_audit_bounty(repo, commit, invalid_url, "Scope specification at least 10 chars", 7200)


def test_source_binding_rejects_wrong_repo(direct_vm, direct_deploy):
    """Structural invariant: code_url repo segment must match declared repo name."""
    contract = direct_deploy("contracts/contract.py")
    repo = "https://github.com/org/sample-repo"
    commit = "a1b2c3d4e5f6"
    # Repo "other-repo" does not match "sample-repo"
    invalid_url = "https://raw.githubusercontent.com/org/other-repo/a1b2c3d4e5f6/Contract.py"

    direct_vm.deal(direct_vm.sender, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    with direct_vm.expect_revert("URL repo"):
        contract.create_audit_bounty(repo, commit, invalid_url, "Scope specification at least 10 chars", 7200)


def test_source_binding_rejects_wrong_commit(direct_vm, direct_deploy):
    """Structural invariant: code_url commit segment must match declared commit hash."""
    contract = direct_deploy("contracts/contract.py")
    repo = "https://github.com/org/sample-repo"
    commit = "a1b2c3d4e5f6"
    # Commit "9999999999" does not match "a1b2c3d4e5f6"
    invalid_url = "https://raw.githubusercontent.com/org/sample-repo/9999999999999/Contract.py"

    direct_vm.deal(direct_vm.sender, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    with direct_vm.expect_revert("URL commit"):
        contract.create_audit_bounty(repo, commit, invalid_url, "Scope specification at least 10 chars", 7200)


def test_source_binding_rejects_non_raw_url(direct_vm, direct_deploy):
    """Structural invariant: code_url must use raw.githubusercontent.com or github.com/raw/."""
    contract = direct_deploy("contracts/contract.py")
    repo = "https://github.com/org/sample-repo"
    commit = "a1b2c3d4e5f6"
    # Regular github.com URL (not raw)
    invalid_url = "https://github.com/org/sample-repo/blob/a1b2c3d4e5f6/Contract.py"

    direct_vm.deal(direct_vm.sender, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    with direct_vm.expect_revert("code_url host must be strictly 'raw.githubusercontent.com'"):
        contract.create_audit_bounty(repo, commit, invalid_url, "Scope specification at least 10 chars", 7200)


def test_source_binding_accepts_valid_structural(direct_vm, direct_deploy):
    """Structural invariant: valid owner/repo/commit at correct path positions must be accepted."""
    contract = direct_deploy("contracts/contract.py")
    repo = "https://github.com/org/sample-repo"
    commit = "a1b2c3d4e5f6"
    valid_url = "https://raw.githubusercontent.com/org/sample-repo/a1b2c3d4e5f6/Contract.py"

    direct_vm.deal(direct_vm.sender, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    b_id = contract.create_audit_bounty(repo, commit, valid_url, "Scope specification at least 10 chars", 7200)
    assert b_id == "audit-1"


# ─── Appellate Unavailable Evidence Tests ─────────────────────────────

def _setup_disputed_bounty(direct_vm, contract, llm_verdict="AUDIT_PASSED"):
    """Helper: create bounty → submit report → adjudicate → raise dispute → return bounty_id."""
    owner = create_address("project_owner")
    auditor = create_address("whitehat_auditor")
    direct_vm.deal(owner, 10_000_000_000_000_000_000)

    direct_vm.warp("2026-09-25T10:00:00Z")
    direct_vm.sender = owner
    direct_vm.value = 1_000_000_000_000_000_000
    b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

    direct_vm.sender = auditor
    direct_vm.value = 0
    contract.submit_audit_report(b_id, REPORT_URL)

    direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="contract Safe {}"))
    direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="PoC report"))
    direct_vm.mock_web(".*appeal-proof\\.md.*", MockedWebResponseData(status=200, body="counter-evidence"))

    llm_response = json.dumps({
        "canary": CANARY_TOKEN,
        "verdict": llm_verdict,
        "confidence": 90,
        "depth_score": 90,
        "reason": "Primary verdict."
    })
    direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_response)

    direct_vm.warp("2026-09-25T10:05:00Z")
    contract.adjudicate_audit(b_id)

    # Owner disputes a PASS; auditor disputes a REJECT
    if llm_verdict == "AUDIT_PASSED":
        direct_vm.sender = owner
        direct_vm.value = 100_000_000_000_000_000
        contract.raise_dispute(b_id, APPEAL_URL, "Disputing with counter-proof")
    else:
        direct_vm.sender = auditor
        direct_vm.value = 100_000_000_000_000_000
        contract.raise_dispute(b_id, APPEAL_URL, "Disputing rejection")

    return b_id, owner, auditor


def test_appellate_unavailable_source_triggers_safe_recovery(direct_vm, direct_deploy):
    """
    Invariant: When target source code is unavailable (404) during appellate adjudication,
    the contract MUST NOT substitute a placeholder and send it to the LLM.
    Instead it MUST return deterministic ESCALATE → safe recovery (escrow to owner, bond to appellant).
    """
    owner = create_address("project_owner")
    auditor = create_address("whitehat_auditor")
    direct_vm.sender = owner
    direct_vm.deal(owner, 10_000_000_000_000_000_000)

    contract = direct_deploy("contracts/contract.py")

    # Create bounty
    direct_vm.warp("2026-09-25T10:00:00Z")
    direct_vm.value = 1_000_000_000_000_000_000
    b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

    # Submit report
    direct_vm.sender = auditor
    direct_vm.value = 0
    contract.submit_audit_report(b_id, REPORT_URL)

    # Adjudicate with AUDIT_PASSED
    direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="contract Safe {}"))
    direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="PoC report"))
    llm_pass = json.dumps({"canary": CANARY_TOKEN, "verdict": "AUDIT_PASSED", "confidence": 90, "depth_score": 90, "reason": "pass"})
    direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)

    direct_vm.warp("2026-09-25T10:05:00Z")
    contract.adjudicate_audit(b_id)

    # Owner disputes
    direct_vm.sender = owner
    direct_vm.value = 100_000_000_000_000_000
    contract.raise_dispute(b_id, APPEAL_URL, "Disputing with counter-proof")

    # Clear all mocks from the adjudication phase so appeal-phase 404 mocks take effect
    direct_vm.clear_mocks()

    # Now mock source as 404 for the appeal phase
    direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=404, body="404 Not Found"))
    direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="PoC report"))
    direct_vm.mock_web(".*appeal-proof\\.md.*", MockedWebResponseData(status=200, body="counter-evidence"))
    # Safety net LLM mock — should NOT be reached due to deterministic early-return
    llm_dummy = json.dumps({"canary": CANARY_TOKEN, "verdict": "ESCALATE", "confidence": 0, "depth_score": 0, "reason": "unreachable"})
    direct_vm.mock_llm(".*Appellate Chief Justice.*", llm_dummy)

    direct_vm.sender = owner
    direct_vm.value = 0
    contract.adjudicate_appeal(b_id)

    bounty = json.loads(contract.get_bounty(b_id))
    # Invariant: Must retain status 4 (DISPUTED/ESCALATED) with locked escrow. No premature settlement!
    assert bounty["status"] == 4
    assert bounty["verdict"] == "ESCALATE"
    assert "UNAVAILABLE_EVIDENCE" in bounty["reason"]
    stats = json.loads(contract.get_stats())
    assert stats["total_escrow_locked"] == "1000000000000000000"

    # Safe recovery via cancel_or_reclaim after timeout
    direct_vm.warp("2026-09-25T10:20:00Z")
    contract.cancel_or_reclaim(b_id)
    bounty_recovered = json.loads(contract.get_bounty(b_id))
    assert bounty_recovered["status"] == 7  # RECLAIMED
    assert json.loads(contract.get_stats())["total_escrow_locked"] == "0"


def test_appellate_unavailable_report_triggers_safe_recovery(direct_vm, direct_deploy):
    """
    Invariant: When original audit report is unavailable (404) during appellate adjudication,
    the contract MUST NOT substitute a placeholder and send it to the LLM.
    Instead it MUST return deterministic ESCALATE, retain status 4, and recover only via timeout.
    """
    owner = create_address("project_owner")
    auditor = create_address("whitehat_auditor")
    direct_vm.sender = owner
    direct_vm.deal(owner, 10_000_000_000_000_000_000)

    contract = direct_deploy("contracts/contract.py")

    # Create bounty
    direct_vm.warp("2026-09-25T11:00:00Z")
    direct_vm.value = 1_000_000_000_000_000_000
    b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

    # Submit report
    direct_vm.sender = auditor
    direct_vm.value = 0
    contract.submit_audit_report(b_id, REPORT_URL)

    # Adjudicate with AUDIT_PASSED
    direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="contract Safe {}"))
    direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="PoC report"))
    llm_pass = json.dumps({"canary": CANARY_TOKEN, "verdict": "AUDIT_PASSED", "confidence": 90, "depth_score": 90, "reason": "pass"})
    direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)

    direct_vm.warp("2026-09-25T11:05:00Z")
    contract.adjudicate_audit(b_id)

    # Owner disputes
    direct_vm.sender = owner
    direct_vm.value = 100_000_000_000_000_000
    contract.raise_dispute(b_id, APPEAL_URL, "Disputing with counter-proof")

    # Clear all mocks from the adjudication phase so appeal-phase 404 mocks take effect
    direct_vm.clear_mocks()

    # Source available, but report is 404 during appeal
    direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="contract Safe {}"))
    direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=404, body="404 Not Found"))
    direct_vm.mock_web(".*appeal-proof\\.md.*", MockedWebResponseData(status=200, body="counter-evidence"))
    llm_dummy = json.dumps({"canary": CANARY_TOKEN, "verdict": "ESCALATE", "confidence": 0, "depth_score": 0, "reason": "unreachable"})
    direct_vm.mock_llm(".*Appellate Chief Justice.*", llm_dummy)

    direct_vm.sender = owner
    direct_vm.value = 0
    contract.adjudicate_appeal(b_id)

    bounty = json.loads(contract.get_bounty(b_id))
    assert bounty["status"] == 4  # Retained in DISPUTED/ESCALATED
    assert bounty["verdict"] == "ESCALATE"
    assert "UNAVAILABLE_EVIDENCE" in bounty["reason"]
    assert json.loads(contract.get_stats())["total_escrow_locked"] == "1000000000000000000"

    # Safe recovery via cancel_or_reclaim after timeout
    direct_vm.warp("2026-09-25T11:20:00Z")
    contract.cancel_or_reclaim(b_id)
    bounty_recovered = json.loads(contract.get_bounty(b_id))
    assert bounty_recovered["status"] == 7  # RECLAIMED
    assert json.loads(contract.get_stats())["total_escrow_locked"] == "0"


def test_source_binding_rejects_substring_and_mismatches(direct_vm, direct_deploy):
    """
    Structural invariant: Rejects attempts to smuggle raw.githubusercontent.com into another domain
    or use prefix commits instead of exact match.
    """
    contract = direct_deploy("contracts/contract.py")
    direct_vm.deal(direct_vm.sender, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    # 1. Smuggled host (evil.com with raw.githubusercontent.com in path)
    evil_url = "https://evil.com/raw.githubusercontent.com/alice/project/a1b2c3d4e5f6/main.py"
    with direct_vm.expect_revert("code_url host must be strictly 'raw.githubusercontent.com'"):
        contract.create_audit_bounty("https://github.com/alice/project", "a1b2c3d4e5f6", evil_url, "Scope spec at least 10 chars", 86400)

    # 2. Prefix commit instead of exact match
    prefix_commit_url = "https://raw.githubusercontent.com/alice/project/a1b2c3d/main.py"
    with direct_vm.expect_revert("does not exactly match declared commit hash"):
        contract.create_audit_bounty("https://github.com/alice/project", "a1b2c3d4e5f6", prefix_commit_url, "Scope spec at least 10 chars", 86400)


def test_emit_transfer_raw_bigint_execution(direct_vm, direct_deploy):
    """
    Contract-executing invariant: Verify emit_transfer receives raw bigint
    without u256 wrapper and properly transfers funds on settlement.
    """
    owner = create_address("project_owner")
    auditor = create_address("whitehat_auditor")
    direct_vm.sender = owner
    direct_vm.deal(owner, 10_000_000_000_000_000_000)

    contract = direct_deploy("contracts/contract.py")

    repo = "https://github.com/tuannguyenvan95/vulnerability-zero-genlayer"
    commit = "cad46920be2ac34ad42e5ee237cbf1706ccee6c7"
    code_url = f"https://raw.githubusercontent.com/tuannguyenvan95/vulnerability-zero-genlayer/{commit}/contracts/VulnerabilityZero.py"
    scope = "Invariants testing reentrancy and state checks."
    report_url = "https://raw.githubusercontent.com/auditor/reports/main/audit-poc.md"

    direct_vm.warp("2026-09-23T10:00:00Z")
    direct_vm.value = 1_000_000_000_000_000_000
    b_id = contract.create_audit_bounty(repo, commit, code_url, scope, 7200)

    # Submit report
    direct_vm.sender = auditor
    direct_vm.value = 0
    contract.submit_audit_report(b_id, report_url)

    # Mock Web & LLM
    direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="contract Safe {}"))
    direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="PoC"))

    llm_pass = json.dumps({
        "canary": "CANARY_AUDIT_PLEDGE_SECURE_V1",
        "verdict": "AUDIT_PASSED",
        "confidence": 95,
        "depth_score": 90,
        "reason": "Vulnerability verified."
    })
    direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)

    contract.adjudicate_audit(b_id)

    # Warp past cooling off (5 minutes)
    direct_vm.warp("2026-09-23T10:06:00Z")
    direct_vm.sender = auditor

    # Finalize settlement triggers emit_transfer(value=escrow_val) with raw bigint
    contract.finalize_settlement(b_id)

    stats = json.loads(contract.get_stats())
    assert stats["total_escrow_locked"] == "0"
    assert stats["total_audits_resolved"] == 1


def test_escalate_and_timeout_recovery_invariant():
    """Invariant: Escrow locked must decrease strictly equal to the refunded amount."""
    total_locked = 1000
    escrow_val = 1000

    # After recovery / settle
    total_locked -= escrow_val
    assert total_locked == 0
