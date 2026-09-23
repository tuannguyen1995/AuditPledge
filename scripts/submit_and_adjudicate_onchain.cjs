const path = require("path");
const { createClient, createAccount, chains } = require(path.join(__dirname, "../frontend/node_modules/genlayer-js"));
const { studionet } = chains;

const CONTRACT_ADDRESS = "0x68824BB321323eF1eabEBefc3e5ef6d165495923";
const AUDITOR_PRIVATE_KEY = "0x1b807b1df022a40f872596b11565e6b6856547dc66996bd3d5a85b376ea3a0ef";
const SPONSOR_PRIVATE_KEY = "0x6c324b6dc21da6dbe57fc460416396c1bb3c4ff14454801cf7fe1eb74d28d277";

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

async function main() {
  console.log("======================================================================");
  console.log(" 🚀 SUBMITTING REPORT & ADJUDICATING ON STUDIONET");
  console.log("======================================================================");

  const auditorAccount = createAccount(AUDITOR_PRIVATE_KEY);
  const auditorClient = createClient({
    chain: studionet,
    account: auditorAccount,
  });

  const reportUrl = "https://raw.githubusercontent.com/tuannguyenvan95/vulnerability-zero-genlayer/cad46920be2ac34ad42e5ee237cbf1706ccee6c7/contracts/VulnerabilityZero.py";

  console.log("\n[Step 2] Whitehat submitting vulnerability report...");
  const submitTxHash = await auditorClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "submit_audit_report",
    args: ["audit-1", reportUrl],
  });
  console.log("  Submitted Report Tx:", submitTxHash);
  await pollReceipt(auditorClient, submitTxHash);
  console.log("  ✅ Report Submitted on-chain!");

  // Now trigger on-chain AI adjudication
  const sponsorAccount = createAccount(SPONSOR_PRIVATE_KEY);
  const sponsorClient = createClient({
    chain: studionet,
    account: sponsorAccount,
  });

  console.log("\n[Step 3] Triggering AI Multi-Validator Adjudication on-chain...");
  const adjTxHash = await sponsorClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "adjudicate_audit",
    args: ["audit-1"],
  });
  console.log("  Submitted Adjudication Tx:", adjTxHash);
  await pollReceipt(sponsorClient, adjTxHash);
  console.log("  ✅ On-Chain AI Adjudication Completed!");

  const bounty = await sponsorClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_bounty",
    args: ["audit-1"],
  });
  console.log("\n[Adjudicated Bounty State]:\n", JSON.stringify(JSON.parse(bounty), null, 2));
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
