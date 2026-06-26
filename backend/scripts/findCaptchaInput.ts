import { env } from "../src/config/env";

(async () => {
  try {
    const playwright = await import("playwright");
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    console.log("Visiting", env.violation.moiUrl);
    await page.goto(env.violation.moiUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    console.log("\n=== SEARCH TYPE: PERSONAL (QID) ===\n");

    // Inspect the QID search form
    const qidFormInfo = await page.evaluate(() => {
      const qidInput = document.querySelector("#qidNo") as HTMLInputElement;
      if (!qidInput) return null;

      const form = qidInput.closest("form");
      if (!form) return { error: "No form found for #qidNo" };

      // Find the captcha image in this form
      const img = form.querySelector(
        'img[id*="captcha" i], img[src*="captcha" i]',
      );
      const captchaInput = form.querySelector('input[id*="captchaResponse" i]');

      // Find ALL button elements in the form
      const buttons = Array.from(
        form.querySelectorAll(
          'button, input[type="button"], input[type="submit"]',
        ),
      ).map((b: any) => ({
        tag: b.tagName,
        type: b.type || "",
        id: b.id || "",
        name: b.name || "",
        text: b.textContent?.trim().slice(0, 50) || "",
        class: b.className || "",
        outer: b.outerHTML?.slice(0, 300) || "",
      }));

      return {
        qidInputId: qidInput.id,
        qidInputName: qidInput.name,
        captchaImageId: img ? (img as any).id : null,
        captchaInputId: captchaInput ? (captchaInput as any).id : null,
        captchaInputName: captchaInput ? (captchaInput as any).name : null,
        formButtons: buttons,
        formId: form.id,
        formAction: form.action,
      };
    });

    console.log("QID Form Info:");
    console.log(JSON.stringify(qidFormInfo, null, 2));

    console.log("\n=== ALL BUTTONS ON PAGE ===\n");

    const allButtons = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(
          'button, input[type="button"], input[type="submit"]',
        ),
      ).map((b: any) => ({
        id: b.id || "",
        name: b.name || "",
        text: b.textContent?.trim().slice(0, 50) || "",
        class: b.className || "",
        type: b.type || "",
      }));
    });

    console.log("All Buttons:");
    console.log(JSON.stringify(allButtons.slice(0, 10), null, 2));

    console.log("\n=== CHECKING COMMON RESULT CONTAINERS ===\n");

    // Check various container classes that might hold results
    const resultContainers = await page.evaluate(() => {
      const containers: any = {};
      const selectors = [
        "table",
        ".table",
        ".results-table",
        '[id*="result" i]',
        '[class*="result" i]',
        '[id*="data" i]',
        ".alert",
        ".alert-danger",
        ".alert-info",
        "#tblData",
        "#violationsTable",
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          containers[sel] = {
            exists: true,
            html: el.outerHTML?.slice(0, 200) || "",
          };
        }
      }

      // Also list all tables
      const tables = Array.from(document.querySelectorAll("table")).map(
        (t: any) => ({
          id: t.id || "no-id",
          class: t.className || "no-class",
          rows: t.querySelectorAll("tbody tr").length,
        }),
      );

      return { containers, tables };
    });

    console.log("Result Containers:");
    console.log(JSON.stringify(resultContainers, null, 2));

    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error("Error while running inspector:", e);
    process.exit(2);
  }
})();
