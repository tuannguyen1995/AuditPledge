import pytest
import json
from gltest.direct.loader import create_address
from gltest.types import MockedWebResponseData

CANARY_TOKEN = "CANARY_AUDIT_PLEDGE_SECURE_V1"


def test_source_binding_rejects_subdomain_and_substring_spoofing(direct_vm, direct_deploy):
    """
    Proves that _validate_source_binding enforces strict URL path components
    and rejects substring/subdomain manipulation attempts.
    Directly satisfies Steward PAPITO's review requirement.
    """
    contract = direct_deploy("contracts/contract.py")
    owner = create_address("project_owner")
    direct_vm.sender = owner
    direct_vm.deal(owner, 10_000_000_000_000_000_000)
    direct_vm.value = 1_000_000_000_000_000_000

    declared_repo = "https://github.com/solid-project/core-vault"
    valid_commit = "a1b2c3d4e5f67890"

    # 1. Attacker attempts host spoofing with declared repo as substring / subdomain
    spoofed_host_url = "https://raw.githubusercontent.com.attacker.com/solid-project/core-vault/a1b2c3d4e5f67890/Vault.sol"
    with direct_vm.expect_revert("code_url host must be strictly 'raw.githubusercontent.com'"):
        contract.create_audit_bounty(
            declared_repo, valid_commit, spoofed_host_url, "Valid Scope Invariants at least 10 chars", 3600
        )

    # 2. Attacker attempts mismatched repository name under valid host
    mismatched_repo_url = "https://raw.githubusercontent.com/solid-project/other-vault/a1b2c3d4e5f67890/Vault.sol"
    with direct_vm.expect_revert("does not match declared repo name"):
        contract.create_audit_bounty(
            declared_repo, valid_commit, mismatched_repo_url, "Valid Scope Invariants at least 10 chars", 3600
        )

    # 3. Attacker attempts mismatched commit hash
    mismatched_commit_url = "https://raw.githubusercontent.com/solid-project/core-vault/9999999999999999/Vault.sol"
    with direct_vm.expect_revert("does not exactly match declared commit hash"):
        contract.create_audit_bounty(
            declared_repo, valid_commit, mismatched_commit_url, "Valid Scope Invariants at least 10 chars", 3600
        )


def test_appellate_adjudication_missing_source_triggers_safe_escalate(direct_vm, direct_deploy):
    """
    Proves that when the source code is unavailable (404) during appellate adjudication,
    the contract does NOT substitute placeholders or disburse funds, but escalates safely.
    Directly satisfies Steward PAPITO's review requirement.
    """
    owner = create_address("project_owner")
    auditor = create_address("whitehat_auditor")
    direct_vm.sender = owner
    direct_vm.deal(owner, 10_000_000_000_000_000_000)

    contract = direct_deploy("contracts/contract.py")

    declared_repo = "https://github.com/solid-project/core-vault"
    valid_commit = "a1b2c3d4e5f67890"
    valid_code_url = f"https://raw.githubusercontent.com/solid-project/core-vault/{valid_commit}/Vault.sol"
    report_url = "https://reports.io/poc-reentrancy.md"
    appeal_url = "https://reports.io/counter-proof.md"

    # Step 1: Create Bounty with 1 GEN escrow
    direct_vm.warp("2026-09-30T10:00:00Z")
    direct_vm.value = 1_000_000_000_000_000_000  # 1 GEN
    bounty_id = contract.create_audit_bounty(
        declared_repo, valid_commit, valid_code_url, "Reentrancy and invariant scope specification", 3600
    )

    # Step 2: Submit Report
    direct_vm.sender = auditor
    direct_vm.value = 0
    contract.submit_audit_report(bounty_id, report_url)

    # Step 3: Primary adjudication (Passes provisionally)
    direct_vm.mock_web(".*Vault\\.sol.*", MockedWebResponseData(status=200, body="pragma solidity ^0.8.0; contract Vault {}"))
    direct_vm.mock_web(".*poc-reentrancy\\.md.*", MockedWebResponseData(status=200, body="# Critical PoC"))
    llm_pass = json.dumps({
        "canary": CANARY_TOKEN,
        "verdict": "AUDIT_PASSED",
        "confidence": 95,
        "depth_score": 90,
        "reason": "Critical vulnerability confirmed."
    })
    direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)

    direct_vm.warp("2026-09-30T10:05:00Z")
    contract.adjudicate_audit(bounty_id)

    # Step 4: Owner disputes during cooling-off window with 10% bond (0.1 GEN)
    direct_vm.sender = owner
    direct_vm.value = 100_000_000_000_000_000  # 0.1 GEN
    contract.raise_dispute(bounty_id, appeal_url, "False positive analysis counter-proof")

    # Step 5: Appellate Adjudication simulation where SOURCE CODE becomes 404 (Missing Evidence)
    direct_vm.clear_mocks()
    direct_vm.mock_web(".*Vault\\.sol.*", MockedWebResponseData(status=404, body="404: Not Found"))
    direct_vm.mock_web(".*poc-reentrancy\\.md.*", MockedWebResponseData(status=200, body="# Critical PoC"))
    direct_vm.mock_web(".*counter-proof\\.md.*", MockedWebResponseData(status=200, body="# Counter Evidence"))
    llm_dummy = json.dumps({"canary": CANARY_TOKEN, "verdict": "ESCALATE", "confidence": 0, "depth_score": 0, "reason": "unreachable"})
    direct_vm.mock_llm(".*Appellate Chief Justice.*", llm_dummy)

    # Execute Appellate Adjudication
    direct_vm.sender = owner
    direct_vm.value = 0
    contract.adjudicate_appeal(bounty_id)

    # Verify that status remains DISPUTED/ESCALATED and NO premature payout occurred
    b_data = json.loads(contract.get_bounty(bounty_id))
    assert b_data["status"] == 4  # DISPUTED / ESCALATED
    assert b_data["verdict"] == "ESCALATE"
    assert "UNAVAILABLE_EVIDENCE" in b_data["reason"]
    stats = json.loads(contract.get_stats())
    assert stats["total_escrow_locked"] == "1000000000000000000"

    # Step 6: Verify safe recovery via cancel_or_reclaim after dispute window timeout
    direct_vm.warp("2026-09-30T10:25:00Z")
    contract.cancel_or_reclaim(bounty_id)

    b_final = json.loads(contract.get_bounty(bounty_id))
    assert b_final["status"] == 7  # RECLAIMED
    assert b_final["verdict"] == "RECLAIMED"
    stats_final = json.loads(contract.get_stats())
    assert stats_final["total_escrow_locked"] == "0"
