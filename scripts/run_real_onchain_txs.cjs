const path = require("path");
const { createClient, createAccount, chains } = require(path.join(__dirname, "../frontend/node_modules/genlayer-js"));
const { studionet } = chains;

const CONTRACT_ADDRESS = "0x76B754983A19860d11d85999d5A1e3e33763e03e";

// Funded accounts on GenLayer StudioNet:
const SPONSOR_PRIVATE_KEY = "0x6c324b6dc21da6dbe57fc460416396c1bb3c4ff14454801cf7fe1eb74d28d277";
const AUDITOR_PRIVATE_KEY = "0x1b807b1df022a40f872596b11565e6b6856547dc66996bd3d5a85b376ea3a0ef";

async function pollReceipt(client, hash) {
  console.log(`  Polling transaction on-chain: ${hash}...`);
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const tx = await client.getTransaction({ hash });
      if (tx) {
        const status = tx.statusName || String(tx.status);
        console.log(`  [Consensus Polling] State: ${status} (iteration ${i + 1}/45)`);
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

async function main() {
  console.log("======================================================================");
  console.log(" 🚀 EXECUTING REAL ON-CHAIN TRANSACTIONS ON GENLAYER STUDIONET");
  console.log(` Target Contract: ${CONTRACT_ADDRESS}`);
  console.log(" RPC: https://studio.genlayer.com/api (Chain ID: 61999)");
  console.log("======================================================================");

  const sponsorAccount = createAccount(SPONSOR_PRIVATE_KEY);
  const auditorAccount = createAccount(AUDITOR_PRIVATE_KEY);

  console.log(`Sponsor (Project Owner) Address: ${sponsorAccount.address}`);
  console.log(`Auditor (Whitehat) Address:      ${auditorAccount.address}`);

  const sponsorClient = createClient({ chain: studionet });
  const auditorClient = createClient({ chain: studionet });

  // STEP 1: Sponsor creates an audit bounty with 1.0 GEN escrow
  console.log("\n----------------------------------------------------------------------");
  console.log(" [TX 1] Sponsor calling 'create_audit_bounty' with 1.0 GEN Escrow...");
  console.log("----------------------------------------------------------------------");

  const repoUrl = "https://github.com/defi-protocol/vault-core";
  const scopeSpec = "Invariants: User balances must decrement strictly before external native transfer. ReentrancyGuard enforced.";
  const durationBlocks = 2000;
  const escrowWei = 1n * 10n ** 18n; // 1 GEN

  const createTxHash = await sponsorClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "create_audit_bounty",
    args: [repoUrl, scopeSpec, durationBlocks],
    value: escrowWei,
    account: sponsorAccount,
  });

  console.log(`✅ Create Bounty Tx Submitted: ${createTxHash}`);
  await pollReceipt(sponsorClient, createTxHash);
  console.log(`🎉 [TX 1 CONFIRMED ON-CHAIN] create_audit_bounty successfully finalized!`);

  // Query bounties to get bounty_id
  const bountiesRaw = await sponsorClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_bounties_paginated",
    args: [0, 10],
  });
  const parsedBounties = typeof bountiesRaw === "string" ? JSON.parse(bountiesRaw) : bountiesRaw;
  console.log(`Current on-chain bounties count: ${parsedBounties.length}`);
  const latestBounty = parsedBounties[parsedBounties.length - 1];
  const targetBountyId = latestBounty ? latestBounty.bounty_id : "audit-1";
  console.log(`Target Bounty ID for Report: ${targetBountyId}`);

  // STEP 2: Whitehat submits vulnerability disclosure report
  console.log("\n----------------------------------------------------------------------");
  console.log(` [TX 2] Auditor calling 'submit_audit_report' for ${targetBountyId}...`);
  console.log("----------------------------------------------------------------------");

  const reportUrl = "https://gist.githubusercontent.com/whitehat/vault_reentrancy_poc.md";
  const submitTxHash = await auditorClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "submit_audit_report",
    args: [targetBountyId, reportUrl],
    value: 0n,
    account: auditorAccount,
  });

  console.log(`✅ Submit Report Tx Submitted: ${submitTxHash}`);
  await pollReceipt(auditorClient, submitTxHash);
  console.log(`🎉 [TX 2 CONFIRMED ON-CHAIN] submit_audit_report successfully finalized!`);

  // STEP 3: Trigger decentralized AI Jury consensus
  console.log("\n----------------------------------------------------------------------");
  console.log(` [TX 3] Calling 'adjudicate_audit' for ${targetBountyId} (AI Consensus)...`);
  console.log("----------------------------------------------------------------------");

  const adjudicateTxHash = await auditorClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "adjudicate_audit",
    args: [targetBountyId],
    value: 0n,
    account: auditorAccount,
  });

  console.log(`✅ Adjudicate Audit Tx Submitted: ${adjudicateTxHash}`);
  console.log("  Waiting for GenLayer decentralized validators to run consensus...");
  await pollReceipt(auditorClient, adjudicateTxHash);
  console.log(`🎉 [TX 3 CONFIRMED ON-CHAIN] adjudicate_audit successfully finalized!`);

  // Final State Inspection
  console.log("\n======================================================================");
  console.log(" 📊 FINAL ON-CHAIN CONTRACT STATE AFTER REAL TRANSACTIONS:");
  const finalStatsRaw = await sponsorClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_stats",
    args: [],
  });
  console.log("Contract Stats:", finalStatsRaw);

  const finalBountiesRaw = await sponsorClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_bounties_paginated",
    args: [0, 10],
  });
  console.log("Bounties:", finalBountiesRaw);
  console.log("======================================================================");
  console.log(`🔗 Check GenLayer Studio Explorer:`);
  console.log(`https://studio.genlayer.com (Contract: ${CONTRACT_ADDRESS})`);
}

main().catch((err) => {
  console.error("❌ On-chain execution failed:", err);
  process.exit(1);
});
