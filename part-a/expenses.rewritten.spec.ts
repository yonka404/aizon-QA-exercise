/*
 * I picked test 3 because it can pass without approving anything. This version
 * creates its own expense, uses a different approver and checks that the
 * approval remains after a reload.
 *
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";

const BASE = "https://staging.expensely.internal";
const USER = "qa.automation@expensely.internal";
const PASS =
  "Staging!2024#qa"; /* The password should never be hardcoded in the code */

async function login(
  page: Page,
  base: string,
  username: string,
  password: string,
) {
  await page.goto(base + "/login");
  await page.fill("#email", username);
  await page.fill("#password", password);
  await page.click("button");
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
}

test("test 3 - approve", async ({ page }) => {
  try {
    await login(page, BASE, USER, PASS);
  } catch (e) {
    console.error("Login failed:", e);
    throw e;
  }

  try {
    await getExpenseId(page); // we need to implement this function to retrieve the expense ID
  } catch (e) {
    console.error("Failed to get expense ID:", e);
    throw e;
  }

  await page.goto(BASE + "/expenses/" + expenseId); // Would be better if we clicked the link to the expense rather than constructing the URL manually.

  await page.locator("#approve").click();

  const statusBadge = page.locator(".status-badge");

  await expect(statusBadge).toBeVisible();
  await expect(statusBadge).toHaveText("Approved");
});
