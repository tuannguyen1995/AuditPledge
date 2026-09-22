const fs = require("fs");
const path = require("path");
const { createClient, createAccount, chains } = require(path.join(__dirname, "../frontend/node_modules/genlayer-js"));
const { studionet } = chains;

const SPONSOR_PRIVATE_KEY = "0x6c324b6dc21da6dbe57fc460416396c1bb3c4ff14454801cf7fe1eb74d28d277";

async function main() {
  console.log("Connecting to GenLayer StudioNet...");
  const sponsorAccount = createAccount(SPONSOR_PRIVATE_KEY);
  console.log("Deployer Address:", sponsorAccount.address);

  const client = createClient({
    chain: studionet,
    account: sponsorAccount,
  });

  const contractPath = path.join(__dirname, "../contracts/contract.py");
  const contractCode = fs.readFileSync(contractPath, "utf8");
  console.log(`Read contract.py (${contractCode.length} bytes).`);

  console.log("Submitting deployment transaction...");
  const txHash = await client.deployContract({
    account: sponsorAccount,
    code: contractCode,
    args: [],
    kwargs: {},
  });
  console.log("Deployment Tx Hash:", txHash);

  console.log("Waiting for deployment receipt...");
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const tx = await client.getTransaction({ hash: txHash });
      if (tx) {
        const status = tx.statusName || String(tx.status);
        console.log(`[Polling ${i + 1}/60] Status: ${status}`);
        if (status === "ACCEPTED" || status === "FINALIZED" || status === "READY_TO_FINALIZE") {
          console.log("Deployment confirmed!");
          console.log("Transaction full object:", JSON.stringify(tx, null, 2));
          return;
        }
        if (status === "CANCELED" || status === "VALIDATORS_TIMEOUT" || status === "UNDETERMINED") {
          console.error("Deployment failed with status:", status);
          console.error("Tx detail:", JSON.stringify(tx, null, 2));
          process.exit(1);
        }
      }
    } catch (e) {
      console.log("Polling error (retrying):", e.message);
    }
  }
  console.error("Timed out waiting for deployment");
}

main().catch((err) => {
  console.error("Deployment script error:", err);
  process.exit(1);
});
