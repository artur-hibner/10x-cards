import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Strona główna", () => {
  test("powinna wyświetlać tytuł", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.title).toBeVisible();
  });

  test("powinna obsługiwać kliknięcie przycisku", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.clickButton();

    // Tutaj możesz dodać weryfikację efektu kliknięcia
    // np. sprawdzając, czy pojawił się określony tekst lub element
  });

  test("powinna wykonywać zrzut ekranu", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(page).toHaveScreenshot("strona-glowna.png");
  });
});
