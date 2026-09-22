const path = require("path");
const { createClient, createAccount, chains } = require(path.join(__dirname, "../frontend/node_modules/genlayer-js"));
const { studionet } = chains;

const CONTRACT_ADDRESS = "0x719fa63855f8f88640f81802057b35e689d927c0";

// Funded accounts on GenLayer StudioNet:
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
  console.log(" 🚀 EXECUTING REAL ON-CHAIN AUDITPLEDGE V2 TRANSACTIONS ON STUDIONET");
  console.log(` Target Contract: ${CONTRACT_ADDRESS}`);
  console.log(" Remediated: Code Revision Bound + Both AI Paths Render Source + No Backdoor");
  console.log("======================================================================");

  const sponsorAccount = createAccount(SPONSOR_PRIVATE_KEY);
  const auditorAccount = createAccount(AUDITOR_PRIVATE_KEY);

  console.log(`Sponsor (Project Owner) Address: ${sponsorAccount.address}`);
  console.log(`Auditor (Whitehat) Address:      ${auditorAccount.address}`);

  const sponsorClient = createClient({ chain: studionet, account: sponsorAccount });
  const auditorClient = createClient({ chain: studionet, account: auditorAccount });

  let targetBountyId = "audit-1";
  let createTxHash = "0xbf0e101787bb01ab83343882259f260a55979f504bacf19e59aa81c6ae331420"; // Existing Tx 1

  // Check if bounties already exist
  const bountiesRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_bounties_paginated",
    args: [0, 10],
  });
  const parsedBounties = typeof bountiesRaw === "string" ? JSON.parse(bountiesRaw) : bountiesRaw;
  console.log(`Current on-chain bounties count: ${parsedBounties ? parsedBounties.length : 0}`);

  if (!parsedBounties || parsedBounties.length === 0) {
    // STEP 1: Create Bounty
    console.log("\n----------------------------------------------------------------------");
    console.log(" [TX 1] Sponsor calling 'create_audit_bounty' (1.0 GEN Escrow)...");
    console.log("----------------------------------------------------------------------");

    const repoUrl = "https://github.com/OpenZeppelin/openzeppelin-contracts";
    const commitHash = "a1b2c3d4e5f";
    const codeUrl = "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/utils/ReentrancyGuard.sol";
    const scopeSpec = "Invariants: nonReentrant modifier must strictly prevent reentrancy during external function calls.";
    const durationBlocks = 2000;
    const escrowWei = 1n * 10n ** 18n; // 1 GEN

    createTxHash = await sponsorClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "create_audit_bounty",
      args: [repoUrl, commitHash, codeUrl, scopeSpec, durationBlocks],
      value: escrowWei,
      account: sponsorAccount,
    });

    console.log(`✅ Create Bounty Tx Submitted: ${createTxHash}`);
    await pollReceipt(sponsorClient, createTxHash);
    console.log(`🎉 [TX 1 CONFIRMED ON-CHAIN] create_audit_bounty successfully finalized!`);
  } else {
    const latest = parsedBounties[parsedBounties.length - 1];
    targetBountyId = latest.bounty_id;
    console.log(`Using existing on-chain bounty: ${targetBountyId}`);
    console.log(`Bound Commit Hash: ${latest.commit_hash}`);
    console.log(`Bound Code URL: ${latest.code_url}`);
  }

  // Check current bounty status
  const currentBountyRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_bounty",
    args: [targetBountyId],
  });
  const currentBounty = JSON.parse(currentBountyRaw);
  console.log(`Current Bounty Status: ${currentBounty.status} (${currentBounty.verdict})`);

  let submitTxHash = "Already Submitted";
  if (currentBounty.status === 0) {
    // STEP 2: Whitehat submits vulnerability disclosure report
    console.log("\n----------------------------------------------------------------------");
    console.log(` [TX 2] Auditor calling 'submit_audit_report' for ${targetBountyId}...`);
    console.log("----------------------------------------------------------------------");

    const reportUrl = "https://raw.githubusercontent.com/tuannguyen1995/AuditPledge/main/README.md";
    submitTxHash = await auditorClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "submit_audit_report",
      args: [targetBountyId, reportUrl],
      value: 0n,
      account: auditorAccount,
    });

    console.log(`✅ Submit Report Tx Submitted: ${submitTxHash}`);
    await pollReceipt(auditorClient, submitTxHash);
    console.log(`🎉 [TX 2 CONFIRMED ON-CHAIN] submit_audit_report successfully finalized!`);
  }

  // STEP 3: Trigger Path 1 Adjudication (AI Multi-Validator Consensus with rendered source code)
  let adjudicateTxHash = "Pending";
  if (currentBounty.status === 1 || currentBounty.status === 0) {
    console.log("\n----------------------------------------------------------------------");
    console.log(` [TX 3] Calling 'adjudicate_audit' (Path 1) for ${targetBountyId}...`);
    console.log("  Decentralized AI Validators render target source code and compare with PoC");
    console.log("----------------------------------------------------------------------");

    adjudicateTxHash = await auditorClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "adjudicate_audit",
      args: [targetBountyId],
      value: 0n,
      account: auditorAccount,
    });

    console.log(`✅ Adjudicate Audit Tx Submitted: ${adjudicateTxHash}`);
    console.log("  Waiting for GenLayer decentralized validators to reach consensus...");
    await pollReceipt(auditorClient, adjudicateTxHash);
    console.log(`🎉 [TX 3 CONFIRMED ON-CHAIN] adjudicate_audit successfully finalized!`);
  }

  // Read bounty status after adjudication
  const bountyPostAdjRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_bounty",
    args: [targetBountyId],
  });
  const bountyPostAdj = JSON.parse(bountyPostAdjRaw);
  console.log("\n======================================================================");
  console.log(`Post-Adjudication Status: ${bountyPostAdj.status} | Verdict: ${bountyPostAdj.verdict}`);
  console.log(`AI Jury Reasoning: ${bountyPostAdj.reason}`);
  console.log(`Technical Depth Score: ${bountyPostAdj.depth_score}/100`);

  const finalStatsRaw = await readContractWithRetry(sponsorClient, {
    address: CONTRACT_ADDRESS,
    functionName: "get_stats",
    args: [],
  });
  console.log("Contract Stats:", finalStatsRaw);
  console.log("======================================================================");
  console.log("Summary of Broadcast On-Chain Transactions:");
  console.log(`1. Deployed Contract:    ${CONTRACT_ADDRESS}`);
  console.log(`2. Create Bounty Tx:     ${createTxHash}`);
  console.log(`3. Submit Report Tx:     ${submitTxHash}`);
  console.log(`4. Adjudicate Audit Tx:  ${adjudicateTxHash}`);
  console.log("======================================================================");
}

main().catch((err) => {
  console.error("❌ On-chain execution failed:", err);
  process.exit(1);
});
