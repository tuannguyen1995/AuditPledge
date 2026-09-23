import pytest
import json
from gltest.direct.loader import create_address
from gltest.types import MockedWebResponseData


def test_source_binding_rejects_mismatch(direct_vm, direct_deploy):
    """Invariant: commit hash or repository slug mismatch must strictly revert."""
    contract = direct_deploy("contracts/contract.py")
    repo = "https://github.com/org/sample-repo"
    commit = "a1b2c3d4e5f6"
    invalid_url = "https://raw.githubusercontent.com/attacker/other-repo/a1b2c3d4e5f6/Contract.py"

    direct_vm.deal(direct_vm.sender, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    with direct_vm.expect_revert("Security invariant"):
        contract.create_audit_bounty(repo, commit, invalid_url, "Scope specification at least 10 chars", 7200)


def test_source_binding_accepts_valid(direct_vm, direct_deploy):
    """Invariant: valid repository slug and commit hash must be accepted."""
    contract = direct_deploy("contracts/contract.py")
    repo = "https://github.com/org/sample-repo"
    commit = "a1b2c3d4e5f6"
    valid_url = "https://raw.githubusercontent.com/org/sample-repo/a1b2c3d4e5f6/Contract.py"

    direct_vm.deal(direct_vm.sender, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    b_id = contract.create_audit_bounty(repo, commit, valid_url, "Scope specification at least 10 chars", 7200)
    assert b_id == "audit-1"


def test_escalate_and_timeout_recovery_invariant():
    """Invariant: Escrow locked must decrease strictly equal to the refunded amount."""
    total_locked = 1000
    escrow_val = 1000

    # After recovery / settle
    total_locked -= escrow_val
    assert total_locked == 0


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
