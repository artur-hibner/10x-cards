import { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly title: Locator;
  readonly button: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator("h1");
    this.button = page.locator('button:has-text("Kliknij mnie")');
  }

  async goto() {
    await this.page.goto("/");
  }

  async clickButton() {
    await this.button.click();
  }

  async isButtonDisabled() {
    return await this.button.isDisabled();
  }
}
