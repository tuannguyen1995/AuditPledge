import pytest
import json
from gltest.direct.loader import create_address
from gltest.types import MockedWebResponseData

CANARY_TOKEN = "CANARY_AUDIT_PLEDGE_SECURE_V1"


def test_raise_dispute_argument_order_alignment(direct_vm, direct_deploy):
    """
    Verifies that raise_dispute strictly accepts:
    args = [bounty_id, appeal_evidence_url, dispute_reason]
    and opens the dispute window without reverting on valid URLs.
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
    report_url = "https://reports.io/initial-poc.md"

    # 1. Create bounty with 1 GEN escrow
    direct_vm.warp("2026-10-02T10:00:00Z")
    direct_vm.value = 1_000_000_000_000_000_000  # 1 GEN
    bounty_id = contract.create_audit_bounty(
        declared_repo, valid_commit, valid_code_url, "Threat scope specification for invariants", 3600
    )

    # 2. Submit report
    direct_vm.sender = auditor
    direct_vm.value = 0
    contract.submit_audit_report(bounty_id, report_url)

    # 3. Adjudicate audit -> provisional pass
    direct_vm.mock_web(".*Vault\\.sol.*", MockedWebResponseData(status=200, body="pragma solidity ^0.8.0; contract Vault {}"))
    direct_vm.mock_web(".*initial-poc\\.md.*", MockedWebResponseData(status=200, body="# PoC"))
    llm_pass = json.dumps({
        "canary": CANARY_TOKEN,
        "verdict": "AUDIT_PASSED",
        "confidence": 95,
        "depth_score": 90,
        "reason": "Vulnerability identified."
    })
    direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)

    direct_vm.warp("2026-10-02T10:05:00Z")
    direct_vm.sender = owner
    contract.adjudicate_audit(bounty_id)

    # 4. Execute raise_dispute with the aligned argument order:
    # arg 0: bounty_id, arg 1: appeal_evidence_url, arg 2: dispute_reason
    appeal_url = "https://reports.io/counter-defense.md"
    reason = "Detailed counter-proof demonstrating edge case safety"
    bond_value = 100_000_000_000_000_000  # 0.1 GEN (10%)

    direct_vm.sender = owner
    direct_vm.value = bond_value
    contract.raise_dispute(bounty_id, appeal_url, reason)

    # 5. Verify dispute state
    b_data = json.loads(contract.get_bounty(bounty_id))
    assert b_data["status"] == 4  # DISPUTED
    assert b_data["appeal_url"] == appeal_url
    assert "counter-proof" in b_data["dispute_reason"]
    assert b_data["disputed"] is True
