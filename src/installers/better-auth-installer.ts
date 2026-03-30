import crypto from "node:crypto";
import Versions from "../versions.json";
import type { NextAppInstaller } from "./next-app-installer";

type BetterAuthInstallerCreateArgs = {
  nextAppInstaller: NextAppInstaller;
};
export class BetterAuthInstaller {
  public static async create(args: BetterAuthInstallerCreateArgs): Promise<BetterAuthInstaller> {
    const installer = new BetterAuthInstaller();
    await installer.init(args);
    return installer;
  }

  private constructor() {}

  private async init(args: BetterAuthInstallerCreateArgs) {
    await args.nextAppInstaller.addDependencyToPackageJson("better-auth", Versions["better-auth"]);
    await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_SECRET", "SECRET", crypto.randomBytes(32).toString("hex"));
    await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_URL", "SERVER", "http://localhost:3000");
    await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_SESSION_DURATION_IN_SECONDS", "SERVER", "3600");
  }
}
