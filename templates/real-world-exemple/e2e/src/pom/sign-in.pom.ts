import type { Locator, Page } from "@playwright/test";
import { Header } from "./components/header";

export class SignInPage {
  public readonly header: Header;
  public readonly title: Locator;

  public constructor(page: Page) {
    this.header = new Header(page);
    this.title = page.getByTestId("sign-in-page-title");
  }
}
