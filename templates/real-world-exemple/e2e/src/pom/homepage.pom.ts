import type { Locator, Page } from "@playwright/test";
import { Header } from "./components/header";

export class HomePage {
  public readonly header: Header;
  public readonly hero: Locator;
  private readonly page: Page;

  public constructor(page: Page) {
    this.page = page;
    this.header = new Header(page);
    this.hero = page.getByTestId("home-page-hero");
  }

  public async goto() {
    await this.page.goto("/");
  }
}
