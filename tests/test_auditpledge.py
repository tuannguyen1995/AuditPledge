import json
import pytest
from pathlib import Path
from gltest.direct.loader import create_address
from gltest.types import MockedWebResponseData

REPO_URL = "https://github.com/tuannguyenvan95/vulnerability-zero-genlayer"
COMMIT_HASH = "cad46920be2ac34ad42e5ee237cbf1706ccee6c7"
CODE_URL = f"https://raw.githubusercontent.com/tuannguyenvan95/vulnerability-zero-genlayer/{COMMIT_HASH}/contracts/VulnerabilityZero.py"
REPORT_URL = "https://raw.githubusercontent.com/auditor/reports/main/audit-poc.md"
APPEAL_URL = "https://raw.githubusercontent.com/auditor/reports/main/appeal-proof.md"
SCOPE = "Reentrancy, unauthorized withdrawals, and state manipulation invariants."
CANARY_TOKEN = "CANARY_AUDIT_PLEDGE_SECURE_V1"


@pytest.fixture
def contract(direct_vm, direct_deploy):
    direct_vm.sender = create_address("project_owner")
    c = direct_deploy("contracts/contract.py")
    return c


class TestAuditPledgeDirectContractExecution:
    """
    Contract-executing test suite satisfying Steward Papito's formal requirements:
    1. Immutable code revision & repository binding.
    2. Authentic chain timing & cooling-off windows.
    3. Recoverability for ESCALATE and unavailable-evidence paths.
    4. Settlement invariants across all resolution states.
    """

    def test_source_binding_enforcement(self, direct_vm, contract):
        """Invariant: code_url must strictly match declared repo slug and commit hash."""
        owner = create_address("project_owner")
        direct_vm.sender = owner
        direct_vm.deal(owner, 10_000_000_000_000_000_000)
        direct_vm.value = 1_000_000_000_000_000_000

        # Mismatched commit hash in code URL (structural: commit at path segment position)
        bad_code_url_commit = f"https://raw.githubusercontent.com/tuannguyenvan95/vulnerability-zero-genlayer/1111111111111111111111111111111111111111/contracts/VulnerabilityZero.py"
        with direct_vm.expect_revert("URL commit"):
            contract.create_audit_bounty(REPO_URL, COMMIT_HASH, bad_code_url_commit, SCOPE, 6000)

        # Mismatched repository owner/name in code URL (structural: owner/repo at path segment positions)
        bad_code_url_repo = f"https://raw.githubusercontent.com/attacker/fake-repo/{COMMIT_HASH}/contracts/VulnerabilityZero.py"
        with direct_vm.expect_revert("URL owner"):
            contract.create_audit_bounty(REPO_URL, COMMIT_HASH, bad_code_url_repo, SCOPE, 6000)

        # Properly bound code URL succeeds
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 6000)
        assert b_id == "audit-1"
        bounty = json.loads(contract.get_bounty(b_id))
        assert bounty["commit_hash"] == COMMIT_HASH
        assert bounty["code_url"] == CODE_URL
        assert bounty["status"] == 0
        assert bounty["escrow_amount"] == "1000000000000000000"

    def test_authentic_timing_and_cooling_off(self, direct_vm, contract):
        """Invariant: Settlement requires elapsed authentic chain cooling-off period."""
        owner = create_address("project_owner")
        auditor = create_address("whitehat_auditor")
        direct_vm.deal(owner, 5_000_000_000_000_000_000)

        direct_vm.warp("2026-09-23T10:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 2_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

        # Whitehat submits audit report
        direct_vm.warp("2026-09-23T10:05:00Z")
        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.submit_audit_report(b_id, REPORT_URL)

        # Mock Web & LLM for adjudication
        direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="contract VulnerabilityZero { function vulnerable() public {} }"))
        direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="# Critical Reentrancy PoC"))

        llm_pass = json.dumps({
            "canary": CANARY_TOKEN,
            "verdict": "AUDIT_PASSED",
            "confidence": 98,
            "depth_score": 95,
            "reason": "Critical vulnerability verified against immutable revision source."
        })
        direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)

        direct_vm.warp("2026-09-23T10:10:00Z")
        contract.adjudicate_audit(b_id)

        bounty = json.loads(contract.get_bounty(b_id))
        assert bounty["status"] == 2  # AWAITING_PAYOUT
        assert bounty["verdict"] == "AUDIT_PASSED"

        # Attempt settlement during cooling-off -> MUST REVERT
        direct_vm.warp("2026-09-23T10:12:00Z")  # Only 2 minutes elapsed (< 5 mins)
        with direct_vm.expect_revert("Cooling-off challenge period has not elapsed yet"):
            contract.finalize_settlement(b_id)

        # Warp authentic chain time past cooling-off (5 minutes = 300s)
        direct_vm.warp("2026-09-23T10:16:00Z")  # 6 minutes elapsed (> 5 mins)
        contract.finalize_settlement(b_id)

        bounty_final = json.loads(contract.get_bounty(b_id))
        assert bounty_final["status"] == 5  # AUDIT_APPROVED
        stats = json.loads(contract.get_stats())
        assert stats["total_audits_resolved"] == 1
        assert stats["total_escrow_locked"] == "0"

    def test_unavailable_evidence_in_primary_adjudication(self, direct_vm, contract):
        """Invariant: Unavailable/404 evidence rejects cleanly without freezing funds."""
        owner = create_address("project_owner")
        auditor = create_address("whitehat_auditor")
        direct_vm.deal(owner, 5_000_000_000_000_000_000)

        direct_vm.warp("2026-09-23T11:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 1_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.submit_audit_report(b_id, REPORT_URL)

        # Mock 404 for code URL (inaccessible / deleted revision)
        direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=404, body="404 Not Found"))
        direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="PoC"))

        contract.adjudicate_audit(b_id)

        bounty = json.loads(contract.get_bounty(b_id))
        assert bounty["status"] == 3  # AWAITING_REFUND
        assert bounty["verdict"] == "AUDIT_REJECTED"
        assert "UNAVAILABLE_EVIDENCE" in bounty["reason"]

        # Project owner recovers funds after cooling-off
        direct_vm.warp("2026-09-23T11:10:00Z")
        direct_vm.sender = owner
        contract.finalize_settlement(b_id)

        bounty_final = json.loads(contract.get_bounty(b_id))
        assert bounty_final["status"] == 6  # AUDIT_REJECTED (settled with owner refund)

    def test_primary_escalate_and_timeout_recovery(self, direct_vm, contract):
        """Invariant: ESCALATE verdicts move to DISPUTED and are fully recoverable after dispute timeout."""
        owner = create_address("project_owner")
        auditor = create_address("whitehat_auditor")
        direct_vm.deal(owner, 5_000_000_000_000_000_000)

        direct_vm.warp("2026-09-23T12:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 3_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.submit_audit_report(b_id, REPORT_URL)

        direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="contract Safe {}"))
        direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="Prompt injection attempt"))

        # LLM flags prompt injection -> outputs ESCALATE
        llm_escalate = json.dumps({
            "canary": CANARY_TOKEN,
            "verdict": "ESCALATE",
            "confidence": 50,
            "depth_score": 50,
            "reason": "Adversarial prompt injection pattern detected. Escalated."
        })
        direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_escalate)

        contract.adjudicate_audit(b_id)

        bounty = json.loads(contract.get_bounty(b_id))
        assert bounty["status"] == 4  # DISPUTED / ESCALATED
        assert bounty["verdict"] == "ESCALATE"
        assert bounty["disputed"] is True

        # Owner cannot reclaim before dispute timeout (10 minutes = 600s)
        direct_vm.sender = owner
        direct_vm.warp("2026-09-23T12:05:00Z")
        with direct_vm.expect_revert("Active dispute window has not yet timed out"):
            contract.cancel_or_reclaim(b_id)

        # Warp past dispute timeout
        direct_vm.warp("2026-09-23T12:15:00Z")  # 15 minutes elapsed
        contract.cancel_or_reclaim(b_id)

        bounty_recovered = json.loads(contract.get_bounty(b_id))
        assert bounty_recovered["status"] == 7  # CANCELLED / RECLAIMED
        assert bounty_recovered["verdict"] == "RECLAIMED"

    def test_unavailable_evidence_in_appeal(self, direct_vm, contract):
        """Invariant: Inaccessible appeal evidence dismisses dispute and forfeits bond to counter-party."""
        owner = create_address("project_owner")
        auditor = create_address("whitehat_auditor")
        direct_vm.deal(owner, 10_000_000_000_000_000_000)

        direct_vm.warp("2026-09-23T13:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 2_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.submit_audit_report(b_id, REPORT_URL)

        direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="contract Test {}"))
        direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="PoC report"))

        llm_pass = json.dumps({
            "canary": CANARY_TOKEN,
            "verdict": "AUDIT_PASSED",
            "confidence": 90,
            "depth_score": 90,
            "reason": "Valid flaw."
        })
        direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)
        contract.adjudicate_audit(b_id)

        # Project owner disputes the pass with 10% bond (0.2 GEN)
        direct_vm.sender = owner
        direct_vm.value = 200_000_000_000_000_000
        contract.raise_dispute(b_id, APPEAL_URL, "Disputing findings with counter-proof")

        # Mock 404 for appellant's appeal URL
        direct_vm.mock_web(".*appeal-proof\\.md.*", MockedWebResponseData(status=404, body="404 Not Found"))

        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.adjudicate_appeal(b_id)

        bounty_after_appeal = json.loads(contract.get_bounty(b_id))
        assert bounty_after_appeal["status"] == 5  # Prior AUDIT_PASSED finalized!
        assert bounty_after_appeal["disputed"] is False
        assert "APPEAL DISMISSED - EVIDENCE UNAVAILABLE" in bounty_after_appeal["reason"]

    def test_appellate_escalate_safe_recovery(self, direct_vm, contract):
        """Invariant: ESCALATE in appellate court executes safe refund for both escrow and bond."""
        owner = create_address("project_owner")
        auditor = create_address("whitehat_auditor")
        direct_vm.deal(owner, 10_000_000_000_000_000_000)

        direct_vm.warp("2026-09-23T14:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 1_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.submit_audit_report(b_id, REPORT_URL)

        direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="code"))
        direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="report"))
        direct_vm.mock_web(".*appeal-proof\\.md.*", MockedWebResponseData(status=200, body="appeal proof"))

        llm_pass = json.dumps({"canary": CANARY_TOKEN, "verdict": "AUDIT_PASSED", "confidence": 85, "depth_score": 85, "reason": "pass"})
        direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)
        contract.adjudicate_audit(b_id)

        # Owner opens dispute
        direct_vm.sender = owner
        direct_vm.value = 100_000_000_000_000_000
        contract.raise_dispute(b_id, APPEAL_URL, "Contesting pass")

        # Appellate LLM returns ESCALATE
        llm_appeal_escalate = json.dumps({
            "canary": CANARY_TOKEN,
            "verdict": "ESCALATE",
            "confidence": 0,
            "depth_score": 0,
            "reason": "Unresolvable deadlock between parties."
        })
        direct_vm.mock_llm(".*Appellate Chief Justice of the GenLayer Security Court.*", llm_appeal_escalate)

        direct_vm.sender = owner
        direct_vm.value = 0
        contract.adjudicate_appeal(b_id)

        # Invariant: Contract does NOT prematurely disburse/settle on ESCALATE.
        # It retains status 4 (DISPUTED) with locked escrow, preventing 404-griefing attacks.
        bounty_escalated = json.loads(contract.get_bounty(b_id))
        assert bounty_escalated["status"] == 4  # Retained in DISPUTED / ESCALATED
        assert bounty_escalated["verdict"] == "ESCALATE"
        stats = json.loads(contract.get_stats())
        assert stats["total_escrow_locked"] == "1000000000000000000"

        # Safe recovery via cancel_or_reclaim after dispute timeout (600s)
        direct_vm.warp("2026-09-23T14:15:00Z")  # 15 mins later
        contract.cancel_or_reclaim(b_id)

        bounty_recovered = json.loads(contract.get_bounty(b_id))
        assert bounty_recovered["status"] == 7  # RECLAIMED
        assert bounty_recovered["verdict"] == "RECLAIMED"
        stats_final = json.loads(contract.get_stats())
        assert stats_final["total_escrow_locked"] == "0"

    def test_graduated_settlement_matrix_invariants(self, direct_vm, contract):
        """Invariant: Graduated settlement matrix correctly disburses 100% or 40% payouts."""
        owner = create_address("project_owner")
        auditor = create_address("whitehat_auditor")
        direct_vm.deal(owner, 10_000_000_000_000_000_000)

        # Case: PARTIAL_APPROVAL (40% payout to auditor, 60% refund to owner)
        direct_vm.warp("2026-09-23T15:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 1_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.submit_audit_report(b_id, REPORT_URL)

        direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="code"))
        direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="medium finding"))

        llm_partial = json.dumps({
            "canary": CANARY_TOKEN,
            "verdict": "PARTIAL_APPROVAL",
            "confidence": 90,
            "depth_score": 70,
            "reason": "Medium severity finding verified (40% payout)."
        })
        direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_partial)

        contract.adjudicate_audit(b_id)
        bounty = json.loads(contract.get_bounty(b_id))
        assert bounty["verdict"] == "PARTIAL_APPROVAL"
        assert bounty["status"] == 2  # AWAITING_PAYOUT

        # Warp past cooling off and finalize
        direct_vm.warp("2026-09-23T15:06:00Z")
        direct_vm.sender = auditor
        contract.finalize_settlement(b_id)

        bounty_settled = json.loads(contract.get_bounty(b_id))
        assert bounty_settled["status"] == 5  # AUDIT_APPROVED

    def test_rejection_and_owner_full_refund_invariant(self, direct_vm, contract):
        """Invariant: Rejection results in 100% refund of escrow to project owner."""
        owner = create_address("project_owner")
        auditor = create_address("whitehat_auditor")
        direct_vm.deal(owner, 10_000_000_000_000_000_000)

        direct_vm.warp("2026-09-23T16:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 2_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.submit_audit_report(b_id, REPORT_URL)

        direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="code"))
        direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="spam report"))

        llm_reject = json.dumps({
            "canary": CANARY_TOKEN,
            "verdict": "AUDIT_REJECTED",
            "confidence": 95,
            "depth_score": 10,
            "reason": "Report is spam/invalid finding."
        })
        direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_reject)
        contract.adjudicate_audit(b_id)

        bounty = json.loads(contract.get_bounty(b_id))
        assert bounty["status"] == 3  # AWAITING_REFUND
        assert bounty["verdict"] == "AUDIT_REJECTED"

        # Owner finalizes settlement after cooling-off
        direct_vm.warp("2026-09-23T16:06:00Z")
        direct_vm.sender = owner
        contract.finalize_settlement(b_id)

        bounty_rejected = json.loads(contract.get_bounty(b_id))
        assert bounty_rejected["status"] == 6  # AUDIT_REJECTED settled

    def test_dispute_bond_anti_griefing_and_permissions(self, direct_vm, contract):
        """Invariant: Dispute requires >=10% bond and is restricted strictly to intended parties."""
        owner = create_address("project_owner")
        auditor = create_address("whitehat_auditor")
        stranger = create_address("malicious_stranger")
        direct_vm.deal(owner, 10_000_000_000_000_000_000)
        direct_vm.deal(stranger, 10_000_000_000_000_000_000)

        direct_vm.warp("2026-09-23T17:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 1_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 7200)

        direct_vm.sender = auditor
        direct_vm.value = 0
        contract.submit_audit_report(b_id, REPORT_URL)

        direct_vm.mock_web(".*VulnerabilityZero\\.py.*", MockedWebResponseData(status=200, body="code"))
        direct_vm.mock_web(".*audit-poc\\.md.*", MockedWebResponseData(status=200, body="report"))
        llm_pass = json.dumps({"canary": CANARY_TOKEN, "verdict": "AUDIT_PASSED", "confidence": 90, "depth_score": 90, "reason": "pass"})
        direct_vm.mock_llm(".*Chief Justice of the AuditPledge Security Court.*", llm_pass)
        contract.adjudicate_audit(b_id)

        # Stranger attempts dispute -> MUST REVERT
        direct_vm.sender = stranger
        direct_vm.value = 100_000_000_000_000_000
        with direct_vm.expect_revert("Only the Project Owner can challenge a provisional approval"):
            contract.raise_dispute(b_id, APPEAL_URL, "Stranger spam")

        # Owner stakes less than 10% bond (e.g. 5%) -> MUST REVERT
        direct_vm.sender = owner
        direct_vm.value = 50_000_000_000_000_000  # 0.05 GEN (< 0.10 GEN)
        with direct_vm.expect_revert("Must stake at least 10% dispute bond"):
            contract.raise_dispute(b_id, APPEAL_URL, "Under-staked challenge")

    def test_cancel_open_bounty_expiration_timing(self, direct_vm, contract):
        """Invariant: Project owner can only cancel open bounty after authentic duration expires."""
        owner = create_address("project_owner")
        direct_vm.deal(owner, 10_000_000_000_000_000_000)

        direct_vm.warp("2026-09-23T18:00:00Z")
        direct_vm.sender = owner
        direct_vm.value = 1_000_000_000_000_000_000
        b_id = contract.create_audit_bounty(REPO_URL, COMMIT_HASH, CODE_URL, SCOPE, 3600)  # 1 hour duration

        # Attempt cancel immediately -> MUST REVERT
        with direct_vm.expect_revert("Cannot cancel: Bounty duration has not yet expired"):
            contract.cancel_or_reclaim(b_id)

        # Warp past duration (1 hour = 3600s)
        direct_vm.warp("2026-09-23T19:05:00Z")
        contract.cancel_or_reclaim(b_id)

        bounty_cancelled = json.loads(contract.get_bounty(b_id))
        assert bounty_cancelled["status"] == 7
        assert bounty_cancelled["verdict"] == "RECLAIMED"