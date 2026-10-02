const path = require("path");
const { createClient, createAccount, chains } = require(path.join(__dirname, "../frontend/node_modules/genlayer-js"));
const { studionet } = chains;

const CONTRACT_ADDRESS = "0x3A37f4ae95C8f19beB1127c78f2968bBe89498c0";

const SPONSOR_PRIVATE_KEY = "0x6c324b6dc21da6dbe57fc460416396c1bb3c4ff14454801cf7fe1eb74d28d277";
const AUDITOR_PRIVATE_KEY = "0x1b807b1df022a40f872596b11565e6b6856547dc66996bd3d5a85b376ea3a0ef";

async function pollReceipt(client, hash) {
  console.log(`  Polling transaction on-chain: ${hash}...`);
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const tx = await client.getTransaction({ hash });
      if (tx) {
        const status = tx.statusName || String(tx.status);
        console.log(`  [Consensus Polling] State: ${status} (round ${i + 1}/50)`);
        if (status === "ACCEPTED" || status === "FINALIZED" || status === "READY_TO_FINALIZE") {
          const leaderExec = tx.consensus_data?.final_leader_execution || tx.consensus_data?.leader_receipt;
          if (leaderExec && leaderExec.execution_result === "ERROR") {
            console.warn(`  ⚠️ Transaction execution result: ERROR (${leaderExec.genvm_result?.error_description || "Execution failed"})`);
          }
          return tx;
        }
        if (
          status === "CANCELED" ||
          status === "VALIDATORS_TIMEOUT" ||
          status === "LEADER_TIMEOUT" ||
          status === "UNDETERMINED"
        ) {
          throw new Error(`Consensus failed: ${status}`);
        }
      }
    } catch (e) {
      if (e.message && e.message.includes("Consensus failed")) throw e;
    }
  }
  throw new Error("Receipt polling timeout");
}

async function readContractWithRetry(client, params, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await client.readContract(params);
    } catch (err) {
      console.log(`  [Read Retry ${attempt}/${retries}] RPC error: ${err.message?.slice(0, 80)}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function main() {
  console.log("======================================================================");
  console.log(" ⚖️ EXECUTING ON-CHAIN DISPUTE & APPELLATE COURT (PATH 2) TRANSACTIONS");
  console.log(` Target Contract: ${CONTRACT_ADDRESS}`);
  console.log("======================================================================");

  const sponsorAccount = createAccount(SPONSOR_PRIVATE_KEY);
  const auditorAccount = createAccount(AUDITOR_PRIVATE_KEY);

  const sponsorClient = createClient({ chain: studionet, account: sponsorAccount });
  const auditorClient = createClient({ chain: studionet, account: auditorAccount });

  let targetBountyId = "audit-1";

  // Check current status of audit-1
  let needsFreshBounty = false;
  try {
    const bountyRaw = await readContractWithRetry(sponsorClient, {
      address: CONTRACT_ADDRESS,
      functionName: "get_bounty",
      args: [targetBountyId],
    });
    const bounty = JSON.parse(bountyRaw);
    console.log(`Found Bounty ${targetBountyId}: Status=${bounty.status} (${bounty.verdict})`);

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const readyAt = Number(bounty.payout_ready_at_block || bounty.payout_ready_at_time || 0);
    // Can only dispute if status 2 (AWAITING_PAYOUT) or 3 (AWAITING_REFUND) and cooling-off not expired
    if ((bounty.status !== 2 && bounty.status !== 3) || (readyAt > 0 && readyAt <= currentTimestamp)) {
      console.log(`Bounty ${targetBountyId} is not eligible for dispute (status=${bounty.status}, readyAt=${readyAt}, now=${currentTimestamp}). Forcing fresh bounty setup...`);
      needsFreshBounty = true;
    }
  } catch (e) {
    needsFreshBounty = true;
  }

  if (needsFreshBounty) {
    console.log("\n----------------------------------------------------------------------");
    console.log(" [SETUP] Creating fresh bounty to exercise the dispute and appeal path...");
    console.log("----------------------------------------------------------------------");

    const REPO = "https://github.com/tuannguyenvan95/vulnerability-zero-genlayer";
    const COMMIT = "cad46920be2ac34ad42e5ee237cbf1706ccee6c7";
    const CODE_URL = `https://raw.githubusercontent.com/tuannguyenvan95/vulnerability-zero-genlayer/${COMMIT}/contracts/VulnerabilityZero.py`;
    const SCOPE = "Verify reentrancy, unauthorized withdrawals, and state manipulation invariants.";

    // 1. Create bounty
    const createTx = await sponsorClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "create_audit_bounty",
      args: [REPO, COMMIT, CODE_URL, SCOPE, 86400],
      value: 1n * 10n ** 17n, // 0.1 GEN
      account: sponsorAccount,
    });
    console.log(`  Bounty creation tx: ${createTx}`);
    await pollReceipt(sponsorClient, createTx);

    // Read stats to find newly created bounty_id
    const statsRaw = await readContractWithRetry(sponsorClient, { address: CONTRACT_ADDRESS, functionName: "get_stats", args: [] });
    const stats = JSON.parse(statsRaw);
    targetBountyId = `audit-${stats.total_bounties}`;
    console.log(`  Created active bounty: ${targetBountyId}`);

    // 2. Submit report
    const submitTx = await auditorClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "submit_audit_report",
      args: [targetBountyId, CODE_URL],
      value: 0n,
      account: auditorAccount,
    });
    console.log(`  Report submission tx: ${submitTx}`);
    await pollReceipt(auditorClient, submitTx);

    // 3. Adjudicate primary
    const adjTx = await sponsorClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "adjudicate_audit",
      args: [targetBountyId],
      value: 0n,
      account: sponsorAccount,
    });
    console.log(`  Primary adjudication tx: ${adjTx}`);
    await pollReceipt(sponsorClient, adjTx);
  }

  // Fetch updated bounty state
  const activeBountyRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_bounty",
    args: [targetBountyId],
  });
  const activeBounty = JSON.parse(activeBountyRaw);
  console.log(`\nActive Bounty for Dispute: ${targetBountyId} | Status: ${activeBounty.status} (${activeBounty.verdict})`);

  // Symmetrical dispute:
  // If status == 2 (provisional pass), project owner disputes.
  // If status == 3 (provisional reject), whitehat auditor disputes.
  const isOwnerDispute = activeBounty.status === 2;
  const disputingClient = isOwnerDispute ? sponsorClient : auditorClient;
  const disputingAccount = isOwnerDispute ? sponsorAccount : auditorAccount;
  const disputingRole = isOwnerDispute ? "Project Owner" : "Whitehat Auditor";

  console.log("\n----------------------------------------------------------------------");
  console.log(` [DISPUTE] ${disputingRole} staking 10% bond and calling 'raise_dispute'...`);
  console.log(` Signature enforced: raise_dispute(bounty_id, appeal_evidence_url, dispute_reason)`);
  console.log("----------------------------------------------------------------------");

  const disputeReason = "Whitehat challenge: The reentrancy vulnerability is demonstrable via state mutation prior to call completion.";
  const appealEvidenceUrl = "https://raw.githubusercontent.com/tuannguyen1995/AuditPledge/main/README.md";
  const bondWei = (BigInt(activeBounty.escrow_amount) / 10n) || 1n; // 10% bond

  // Calling raise_dispute with exact aligned order: [bounty_id, appeal_evidence_url, dispute_reason]
  const disputeTxHash = await disputingClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "raise_dispute",
    args: [targetBountyId, appealEvidenceUrl, disputeReason],
    value: bondWei,
    account: disputingAccount,
  });

  console.log(`✅ Raise Dispute Tx Submitted: ${disputeTxHash}`);
  await pollReceipt(disputingClient, disputeTxHash);
  console.log(`🎉 [DISPUTE CONFIRMED ON-CHAIN] raise_dispute successfully finalized!`);

  // Check status after dispute
  const postDisputeRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_bounty",
    args: [targetBountyId],
  });
  const postDispute = JSON.parse(postDisputeRaw);
  console.log(`\nPost-Dispute Status: ${postDispute.status} (Disputed: ${postDispute.disputed})`);
  console.log(`Appeal Evidence URL bound: ${postDispute.appeal_url}`);
  console.log(`Dispute Bond Staked: ${postDispute.dispute_bond} wei`);

  // If status is 4 (DISPUTED), trigger Path 2: adjudicate_appeal
  let appealTxHash = "None";
  if (postDispute.status === 4) {
    console.log("\n----------------------------------------------------------------------");
    console.log(` [APPEAL] Calling 'adjudicate_appeal' (Path 2: Appellate Security Court)...`);
    console.log("  Decentralized Court cross-examines target code, original report & appeal URL");
    console.log("----------------------------------------------------------------------");

    appealTxHash = await auditorClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "adjudicate_appeal",
      args: [targetBountyId],
      value: 0n,
      account: auditorAccount,
    });

    console.log(`✅ Adjudicate Appeal Tx Submitted: ${appealTxHash}`);
    console.log("  Waiting for Appellate Court consensus on StudioNet...");
    await pollReceipt(auditorClient, appealTxHash);
    console.log(`🎉 [APPEAL CONFIRMED ON-CHAIN] adjudicate_appeal successfully finalized!`);
  }

  // Final check
  const finalBountyRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_bounty",
    args: [targetBountyId],
  });
  const finalBounty = JSON.parse(finalBountyRaw);
  console.log("\n======================================================================");
  console.log(" 🏛️ FINAL ON-CHAIN APPELLATE COURT RESOLUTION:");
  console.log(`Bounty ID: ${targetBountyId}`);
  console.log(`Status: ${finalBounty.status} | Verdict: ${finalBounty.verdict}`);
  console.log(`Court Reasoning: ${finalBounty.reason}`);
  console.log(`Confidence: ${finalBounty.confidence}% | Technical Depth: ${finalBounty.depth_score}/100`);

  const finalStatsRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_stats",
    args: [],
  });
  console.log("Final Stats:", finalStatsRaw);
  console.log("======================================================================");
  console.log("Summary of Full Dispute & Appeal Execution on StudioNet:");
  console.log(`• Contract Address:     ${CONTRACT_ADDRESS}`);
  console.log(`• Target Bounty:        ${targetBountyId}`);
  console.log(`• Tx Raise Dispute:     ${disputeTxHash}`);
  console.log(`• Tx Adjudicate Appeal: ${appealTxHash}`);
  console.log("======================================================================");
}

main().catch((err) => {
  console.error("❌ On-chain execution failed:", err);
  process.exit(1);
});
