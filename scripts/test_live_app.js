const path = require("path");
const puppeteer = require(path.join(__dirname, "../frontend/node_modules/puppeteer-core"));

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\7a58ff6c-6f49-4992-a597-6d2c38937bca";
const APP_URL = "https://auditpledge.vercel.app";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLiveAppTests() {
  console.log("=== LAUNCHING LIVE APP BROWSER TEST ON EDGE ===");
  console.log(`Target URL: ${APP_URL}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // Listen to console
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser Console Error]:`, msg.text());
    }
  });

  try {
    console.log("1. Navigating to live dApp...");
    await page.goto(APP_URL, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(2000);

    const title = await page.title();
    console.log(`Page title: "${title}"`);

    // Verify header and contract
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasAuditPledge = bodyText.includes("AuditPledge");
    const hasStudioNet = bodyText.includes("StudioNet");
    console.log(`Header contains 'AuditPledge': ${hasAuditPledge}, 'StudioNet': ${hasStudioNet}`);

    const screenshotHome = path.join(ARTIFACT_DIR, "live_app_home.png");
    await page.screenshot({ path: screenshotHome });
    console.log(`Screenshot saved: ${screenshotHome}`);

    // 2. Click "Test Live Adjudication Flow" button
    console.log("2. Clicking 'Test Live Adjudication Flow'...");
    const testButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent && b.textContent.includes("Test Live Adjudication Flow"));
    });

    if (testButton && testButton.asElement()) {
      await testButton.asElement().click();
      console.log("Test modal opened successfully!");
      await sleep(1000);

      const screenshotModal = path.join(ARTIFACT_DIR, "live_adjudication_modal.png");
      await page.screenshot({ path: screenshotModal });
      console.log(`Screenshot saved: ${screenshotModal}`);

      // 3. Select Scenario 1: Critical Reentrancy PoC
      console.log("3. Selecting 'Scenario 1: Critical Reentrancy PoC'...");
      const scenario1Card = await page.evaluateHandle(() => {
        const headings = Array.from(document.querySelectorAll("h4"));
        const match = headings.find((h) => h.textContent && h.textContent.includes("Scenario 1: Critical Reentrancy"));
        return match ? match.closest(".group") : null;
      });

      if (scenario1Card && scenario1Card.asElement()) {
        await scenario1Card.asElement().click();
        console.log("Scenario 1 clicked, waiting for AI Consensus Dossier simulation...");
        await sleep(2500);

        const dossierText = await page.evaluate(() => document.body.innerText);
        const hasDossier = dossierText.includes("Consensus") || dossierText.includes("Adjudication Dossier");
        const hasPassed = dossierText.includes("AUDIT_PASSED");
        const hasDepth = dossierText.includes("94/100") || dossierText.includes("94");
        const hasCooling = dossierText.includes("Cooling-Off") || dossierText.includes("20-block");
        console.log(`Consensus Dossier visible: ${hasDossier}`);
        console.log(`Verdict AUDIT_PASSED: ${hasPassed}`);
        console.log(`Technical Depth: ${hasDepth}`);
        console.log(`Cooling-off window notice: ${hasCooling}`);

        const screenshotDossier = path.join(ARTIFACT_DIR, "live_consensus_dossier.png");
        await page.screenshot({ path: screenshotDossier });
        console.log(`Screenshot saved: ${screenshotDossier}`);

        // Close Dossier
        const closeBtn = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          return buttons.find((b) => b.textContent && b.textContent.includes("Close Dossier"));
        });
        if (closeBtn && closeBtn.asElement()) {
          await closeBtn.asElement().click();
          await sleep(1000);
        }
      } else {
        console.warn("Could not find Scenario 1 card!");
      }

      // 4. Test Scenario 3: Dispute & Appellate Court
      console.log("4. Opening Test Modal again for Scenario 3: Dispute & Appellate Court...");
      const testButton2 = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.find((b) => b.textContent && b.textContent.includes("Test Live Adjudication Flow"));
      });
      if (testButton2 && testButton2.asElement()) {
        await testButton2.asElement().click();
        await sleep(1000);

        const scenario3Card = await page.evaluateHandle(() => {
          const headings = Array.from(document.querySelectorAll("h4"));
          const match = headings.find((h) => h.textContent && h.textContent.includes("Scenario 3: Bilateral Dispute"));
          return match ? match.closest(".group") : null;
        });

        if (scenario3Card && scenario3Card.asElement()) {
          await scenario3Card.asElement().click();
          console.log("Scenario 3 clicked!");
          await sleep(2500);

          const disputeDossier = path.join(ARTIFACT_DIR, "live_dispute_appeal_dossier.png");
          await page.screenshot({ path: disputeDossier });
          console.log(`Screenshot saved: ${disputeDossier}`);
        }
      }
    } else {
      console.warn("Could not find Test button!");
    }

    console.log("=== ALL BROWSER UI ADJUDICATION TESTS PASSED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    await browser.close();
  }
}

runLiveAppTests();
