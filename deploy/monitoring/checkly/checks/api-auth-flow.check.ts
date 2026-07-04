import { BrowserCheck } from "checkly/constructs";

const authFlowCheck = new BrowserCheck("dream-home-11-auth-flow", {
  logicalId: "AuthFlowCheck",
  name: "Auth Flow - Login OTP Check",
  activated: true,
  frequency: 5,
  frequencyUnit: "minutes",
  locations: ["us-east-1", "eu-west-1", "ap-south-1"],
  tags: ["production", "auth", "browser", "critical"],
  script: `
    const { chromium } = require("playwright");

    const phone = process.env.TEST_PHONE_NUMBER || "9876543210";

    (async () => {
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // Navigate to login page
        await page.goto(process.env.LOGIN_URL || "https://dreamhome11.com/login", {
          waitUntil: "networkidle",
          timeout: 15000,
        });

        // Enter phone number
        await page.waitForSelector('input[name="phone"], input[type="tel"], input[placeholder*="phone"]', {
          timeout: 5000,
        });
        await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone"]', phone);

        // Click send OTP button
        await page.waitForSelector('button:has-text("Send OTP"), button:has-text("Get OTP"), button[type="submit"]', {
          timeout: 5000,
        });
        await page.click('button:has-text("Send OTP"), button:has-text("Get OTP"), button[type="submit"]');

        // Verify OTP request succeeded - look for success message or OTP input
        await page.waitForSelector('input[name="otp"], input[placeholder*="OTP"], .otp-input, [data-testid="otp-input"]', {
          timeout: 10000,
        });

        // Verify the OTP input is visible
        const otpInput = await page.isVisible('input[name="otp"], input[placeholder*="OTP"], .otp-input');
        if (!otpInput) {
          throw new Error("OTP input not visible after requesting OTP");
        }

        console.log("Auth flow check passed: OTP request succeeded");
      } catch (error) {
        console.error("Auth flow check failed:", error.message);
        throw error;
      } finally {
        await browser.close();
      }
    })();
  `,
  alertChannels: [
    {
      alertChannelId: "${SLACK_ALERT_CHANNEL_ID}",
      activated: true,
    },
    {
      alertChannelId: "${PAGERDUTY_ALERT_CHANNEL_ID}",
      activated: true,
    },
  ],
  useGlobalAlertSettings: false,
  environmentVariables: [
    {
      key: "BASE_URL",
      value: "${BASE_URL}",
      locked: true,
    },
    {
      key: "LOGIN_URL",
      value: "${LOGIN_URL}",
      locked: true,
    },
    {
      key: "TEST_PHONE_NUMBER",
      value: "${TEST_PHONE_NUMBER}",
      locked: true,
    },
  ],
  groupSetupScript: undefined,
  groupTeardownScript: undefined,
  videoRecording: true,
  browser_snippets: [],
});

export default authFlowCheck;
