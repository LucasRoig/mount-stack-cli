import type { Locator, Page } from "@playwright/test";

export class Header {
  private readonly locator: Locator;
  private readonly homePageLink: Locator;
  private readonly signInLink: Locator;
  private readonly signUpLink: Locator;

  public constructor(page: Page) {
    this.locator = page.getByTestId("app-header");
    this.homePageLink = this.locator.getByTestId("header-home-page-link");
    this.signInLink = this.locator.getByTestId("header-sign-in-link");
    this.signUpLink = this.locator.getByTestId("header-sign-up-link");
  }

  public async clickHomePageLink() {
    await this.homePageLink.click();
  }

  public async clickSignInLink() {
    await this.signInLink.click();
  }

  public async clickSignUpLink() {
    await this.signUpLink.click();
  }
}
