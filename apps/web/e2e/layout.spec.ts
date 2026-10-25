import { expect, test } from "@playwright/test";

const widths = [390, 1440];
const pages = ["/dev/components", "/"];

for (const width of widths) {
  for (const path of pages) {
    test(`${path} has no horizontal page scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.waitForLoadState("load");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
}

test("component preview renders every component group", async ({ page }) => {
  await page.goto("/dev/components");
  for (const heading of ["KPI cards", "Workspace", "Pills, status and P&L", "Empty and loading states", "Dangerous actions"]) {
    await expect(page.getByRole("heading", { name: new RegExp(heading) })).toBeVisible();
  }
  await expect(page.getByRole("table", { name: "Open option positions" })).toBeVisible();
  await expect(page.getByRole("meter").first()).toBeVisible();
});

test("kill switch asks for a reason and the word FLATTEN", async ({ page }) => {
  await page.goto("/dev/components");
  await page.getByRole("button", { name: "Kill switch" }).click();
  const confirm = page.getByRole("button", { name: "Flatten and halt" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/reason/i).fill("Exchange outage");
  await page.getByLabel(/to confirm/i).fill("FLATTEN");
  await expect(confirm).toBeEnabled();
});

test("rail stacks below the content on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto("/dev/components");
  const main = await page.getByRole("region", { name: "Open positions" }).boundingBox();
  const rail = await page.getByRole("complementary", { name: "Side panel" }).boundingBox();
  expect(rail!.y).toBeGreaterThan(main!.y + main!.height - 1);
});
