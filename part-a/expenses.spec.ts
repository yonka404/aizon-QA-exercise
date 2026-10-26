import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE = 'https://staging.expensely.internal';
const USER = 'qa.automation@expensely.internal';
const PASS = 'Staging!2024#qa'; /* The password should never be hardcoded in the code */

let expenseId: string;
let approvalCount = 0;

test.describe('Expenses', () => {

  test('test 1', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.fill('#email', USER);
    await page.fill('#password', PASS);
    await page.click('button');
    await page.waitForTimeout(5000); // Fixed sleeps are a bad pratice, we should use proper wait conditions.
    expect(page.url()).toContain('/dashboard');
  });

  test('test 2 - create', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.fill('#email', USER);
    await page.fill('#password', PASS);
    await page.click('button');
    await page.waitForTimeout(5000); // Again, fixed sleeps are a bad practice

    await page.goto(BASE + '/expenses/new');
    await page.fill('input[name="amount"]', '250');
    await page.fill('input[name="description"]', 'Taxi');
    await page.click('div.form-actions > button:nth-child(2)'); // We should use a more specific selector to avoid flakiness
    await page.waitForTimeout(3000); // Again, fixed sleeps are a bad practice. Specially here since we are waiting for a table to be populated

    const row = await page.$('//table/tbody/tr[1]/td[1]');
    expenseId = (await row?.innerText()) || '';
    expect(expenseId).toBeTruthy(); // We should check that the text here is Taxi and 250

    await page.screenshot({ path: 'screenshot.png' }); // This can overwrite previous screenshots
  });

  test('test 3 - approve', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.fill('#email', USER);
    await page.fill('#password', PASS);
    await page.click('button');
    await page.waitForTimeout(5000); // Fixed sleeps are a bad practice

    await page.goto(BASE + '/expenses/' + expenseId); // Where is the expenseId coming from? This is a bad practice, we should not rely on state from previous tests.

    try {
      await page.click('#approve');
      approvalCount++;
    } catch (e) {
      console.log('approve button not found, skipping');
    }

    if (await page.locator('.status-badge').isVisible()) {
      expect(await page.locator('.status-badge').innerText()).toBe('Approved');
    }

    expect(approvalCount).toBeGreaterThanOrEqual(0); // This will always be true
  });

  test('test 4 - audit log shows the approval', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.fill('#email', USER);
    await page.fill('#password', PASS);
    await page.click('button');
    await page.waitForTimeout(5000); // Fixed sleeps are a bad practice

    await page.goto(BASE + '/expenses/' + expenseId + '/audit'); // Again, we are relying on state from previous tests, which is a bad practice
    const entries = page.locator('.audit-entry');
    expect(entries.first()).toContainText('Approved'); // We should not rely on the order of the entries. Also, we should use an await here

    const today = new Date().toLocaleDateString(); // It's better to use a fixed date for testing, but this is ok
    expect(await page.locator('.audit-entry').first().innerText()).toContain(today);

    fs.writeFileSync('evidence.txt', 'audit checked'); // Playwright’s built-in reports and screenshots would be more useful for audit traceability
  });

  test.skip('test 5 - reject flow', async ({ page }) => {
    // TODO
    // I would remove it or explain why it is skipped
  });

  test('test 6 - totals', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.fill('#email', USER);
    await page.fill('#password', PASS);
    await page.click('button');
    await page.waitForTimeout(5000); // Fixed sleeps are a bad practice

    await page.goto(BASE + '/expenses');
    const total = await page.locator('#total').innerText(); // We should use a try-catch here
    expect(parseFloat(total.replace('€', ''))).toBe(250);
  });
});
