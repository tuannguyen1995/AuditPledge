const path = require("path");
const { createClient, createAccount, chains } = require(path.join(__dirname, "../frontend/node_modules/genlayer-js"));
const { studionet } = chains;

const CONTRACT_ADDRESS = "0x719fa63855f8f88640f81802057b35e689d927c0";

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

  const targetBountyId = "audit-1";

  // Check current status
  const bountyRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_bounty",
    args: [targetBountyId],
  });
  const bounty = JSON.parse(bountyRaw);
  console.log(`Current Bounty Status: ${bounty.status} (${bounty.verdict})`);
  console.log(`Dispute Initiator: ${bounty.dispute_initiator}`);
  console.log(`Disputed Flag: ${bounty.disputed}`);

  // Status 3 is AWAITING_REFUND (Provisional Reject). Auditor challenges provisional reject!
  let disputeTxHash = "None";
  if (bounty.status === 3) {
    console.log("\n----------------------------------------------------------------------");
    console.log(` [TX 4] Auditor staking 10% bond (0.1 GEN) and calling 'raise_dispute'...`);
    console.log("----------------------------------------------------------------------");

    const disputeReason = "Whitehat challenge: The reentrancy vulnerability is demonstrable via state mutation prior to call completion.";
    const appealEvidenceUrl = "https://raw.githubusercontent.com/tuannguyen1995/AuditPledge/main/README.md";
    const bondWei = 1n * 10n ** 17n; // 0.1 GEN (10% of 1.0 GEN escrow)

    disputeTxHash = await auditorClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "raise_dispute",
      args: [targetBountyId, disputeReason, appealEvidenceUrl],
      value: bondWei,
      account: auditorAccount,
    });

    console.log(`✅ Raise Dispute Tx Submitted: ${disputeTxHash}`);
    await pollReceipt(auditorClient, disputeTxHash);
    console.log(`🎉 [TX 4 CONFIRMED ON-CHAIN] raise_dispute successfully finalized!`);
  }

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
    console.log(` [TX 5] Calling 'adjudicate_appeal' (Path 2: Appellate Security Court)...`);
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
    console.log(`🎉 [TX 5 CONFIRMED ON-CHAIN] adjudicate_appeal successfully finalized!`);
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
  console.log("Summary of Full Lifecycle On-Chain Transactions:");
  console.log(`• Contract Address:     ${CONTRACT_ADDRESS}`);
  console.log(`• Tx 1 (Create Bounty): 0xbf0e101787bb01ab83343882259f260a55979f504bacf19e59aa81c6ae331420`);
  console.log(`• Tx 2 (Submit Report): 0x59ce7b13312ae11b62eccb6407e060d2c3de46cca11c33c209b3e2f2131cf036`);
  console.log(`• Tx 3 (Adjudicate P1): 0xfd2b2ec4f02ef392858e2e10c0bf25ea8fad68c37d75d24decbbf271b022aee5`);
  console.log(`• Tx 4 (Raise Dispute): ${disputeTxHash}`);
  console.log(`• Tx 5 (Adjudicate P2): ${appealTxHash}`);
  console.log("======================================================================");
}

main().catch((err) => {
  console.error("❌ On-chain execution failed:", err);
  process.exit(1);
});
