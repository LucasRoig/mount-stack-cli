import fs from "node:fs/promises";
import { resolve } from "node:path";
import { TEMPLATE_ROOT } from "../consts";
import { NextLayoutFile } from "../helpers/next-layout-file";
import Versions from "../versions.json";
import type { DesignSystemInstaller } from "./design-system-installer";
import type { NextAppInstaller } from "./next-app-installer";
import type { PlaywrightInstaller } from "./playwright-installer";

type InstallRealWorldAppOptions = {
  nextAppInstaller: NextAppInstaller;
  designSystemInstaller: DesignSystemInstaller;
  playwrightInstaller: PlaywrightInstaller;
};

export async function installRealWorldApp(options: InstallRealWorldAppOptions) {
  const nextTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "next");
  await fs.cp(nextTemplateRoot, options.nextAppInstaller.nextAppRootPath, { recursive: true });

  const playwrightTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "e2e");
  await fs.cp(playwrightTemplateRoot, options.playwrightInstaller.rootPath, { recursive: true });

  const submodulePrefix = options.designSystemInstaller.submodulePrefix;
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/button`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/field`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/form`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/utils`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/sonner`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson("@radix-ui/react-slot", Versions["@radix-ui/react-slot"]);

  const layoutFile = await NextLayoutFile.fromPath(options.nextAppInstaller.rootLayoutPath);
  layoutFile.addImportDeclaration({
    namedImports: ["Toaster"],
    moduleSpecifier: `${submodulePrefix}/sonner`,
  });
  layoutFile.addComponentBeforeChildren("<Toaster/>");

  layoutFile.addImportDeclaration({
    namedImports: ["PageLayoutWithHeader"],
    moduleSpecifier: "@/components/layout/page-layout-with-header",
  });
  layoutFile.wrapChildrenWithComponent("<PageLayoutWithHeader>", "</PageLayoutWithHeader>");
  await layoutFile.save();
}
