import { expect, test } from "@playwright/test";
import { HomePage } from "../pom/homepage.pom";
import { SignInPage } from "../pom/sign-in.pom";
import { SignUpPage } from "../pom/sign-up.pom";

test("navigation by header links", async ({ page }) => {
  const homePage = new HomePage(page);
  const signInPage = new SignInPage(page);
  const signUpPage = new SignUpPage(page);

  await homePage.goto();
  await expect(homePage.hero).toBeVisible();
  homePage.header.clickSignInLink();

  await expect(signInPage.title).toBeVisible();
  signInPage.header.clickSignUpLink();

  await expect(signUpPage.title).toBeVisible();
  signUpPage.header.clickHomePageLink();

  await expect(homePage.hero).toBeVisible();
});
