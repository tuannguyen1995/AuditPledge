const path = require("path");
const { createClient, createAccount, chains } = require(path.join(__dirname, "../frontend/node_modules/genlayer-js"));
const { studionet } = chains;

const CONTRACT_ADDRESS = "0xED217aAf1858c13F827aC58a83C7001d293FA8f9";
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
  console.log(" 🚀 SEEDING REAL ON-CHAIN BOUNTY ON STUDIONET");
  console.log(` Target Contract: ${CONTRACT_ADDRESS}`);
  console.log("======================================================================");

  const sponsorAccount = createAccount(SPONSOR_PRIVATE_KEY);
  const client = createClient({
    chain: studionet,
    account: sponsorAccount,
  });

  const repoUrl = "https://github.com/tuannguyenvan95/vulnerability-zero-genlayer";
  const commitHash = "cad46920be2ac34ad42e5ee237cbf1706ccee6c7";
  const codeUrl = `https://raw.githubusercontent.com/tuannguyenvan95/vulnerability-zero-genlayer/${commitHash}/contracts/VulnerabilityZero.py`;
  const scope = "Verify reentrancy, unauthorized withdrawals, and state manipulation invariants.";

  console.log("\n[Step 1] Creating Audit Bounty on-chain...");
  const createTxHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "create_audit_bounty",
    args: [repoUrl, commitHash, codeUrl, scope, 86400],
    value: 100000000000000000n, // 0.1 GEN
  });
  console.log("  Submitted Create Bounty Tx:", createTxHash);
  await pollReceipt(client, createTxHash);
  console.log("  ✅ Bounty Created successfully on-chain!");

  // Read stats
  const stats = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_stats",
    args: [],
  });
  console.log("\n[Contract Stats]:", stats);

  const bounties = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_bounties_paginated",
    args: [0, 5],
  });
  console.log("\n[Live Bounties]:", bounties);
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
