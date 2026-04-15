import fs from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";
import { TEMPLATE_ROOT } from "../consts";
import { updateJsonFile } from "../helpers/json-file";
import { NextLayoutFile } from "../helpers/next-layout-file";
import Versions from "../versions.json";
import type { DatabaseInstaller } from "./database-installer";
import type { DesignSystemInstaller } from "./design-system-installer";
import type { NextAppInstaller } from "./next-app-installer";
import type { OrpcInstaller } from "./orpc-installer";
import type { PlaywrightInstaller } from "./playwright-installer";

type InstallRealWorldAppOptions = {
  nextAppInstaller: NextAppInstaller;
  designSystemInstaller: DesignSystemInstaller;
  playwrightInstaller: PlaywrightInstaller;
  orpcInstaller: OrpcInstaller;
  databaseInstaller: DatabaseInstaller;
};

export async function installRealWorldApp(options: InstallRealWorldAppOptions) {
  const nextTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "next");
  await fs.cp(nextTemplateRoot, options.nextAppInstaller.nextAppRootPath, { recursive: true });

  const playwrightTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "e2e");
  await fs.cp(playwrightTemplateRoot, options.playwrightInstaller.rootPath, { recursive: true });

  const apiTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "api");
  await fs.cp(apiTemplateRoot, options.orpcInstaller.getRootPath(), { recursive: true });

  //database
  const prismaSchema = await options.databaseInstaller.getPrismaSchema();
  prismaSchema.getModelByNameOrThrow("User").content.push({ kind: "field", content: "bio    String?" });
  await prismaSchema.save();

  const submodulePrefix = options.designSystemInstaller.submodulePrefix;
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/avatar`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/button`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/dropdown-menu`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/field`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/form`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/sonner`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson(`${submodulePrefix}/utils`, "workspace:*");
  await options.nextAppInstaller.addDependencyToPackageJson("@radix-ui/react-slot", Versions["@radix-ui/react-slot"]);
  await options.nextAppInstaller.addDependencyToPackageJson("lucide-react", Versions["lucide-react"]);
  await options.nextAppInstaller.addDependencyToPackageJson("ts-pattern", Versions["ts-pattern"]);

  const routeFile = await options.nextAppInstaller.getRouteFile();
  const routesObject = routeFile
    .getVariableStatementOrThrow("Routes")
    .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclarationList)
    .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclaration)
    .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
  routesObject.addPropertyAssignments([
    {
      name: "settings",
      initializer: '"/settings"',
    },
    {
      name: "profile",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the template is part of the string
      initializer: "(username: string) => `/profile/${username}`",
    },
    {
      name: "editor",
      initializer: '"/editor"',
    },
  ]);
  routesObject
    .getPropertyOrThrow("auth")
    .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
    .addPropertyAssignment({
      name: "signUp",
      initializer: '"/auth/sign-up"',
    });
  routeFile.formatText();
  await routeFile.save();

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

  // Remove useless page
  await fs.rmdir(resolve(options.nextAppInstaller.srcPath, "app/(protected)/protected-page"), { recursive: true });

  //API
  await options.orpcInstaller.addDependencyToPackageJson("ts-pattern", Versions["ts-pattern"]);
  await options.orpcInstaller.addDependencyToPackageJson("drizzle-orm", Versions["drizzle-orm"]);
  await updateJsonFile(options.orpcInstaller.packageJsonPath, (json) => {
    if (!json.exports) {
      json.exports = {};
    }
    json.exports["./schemas"] = {
      "vs-code-lsp": {
        types: "./dist/schemas/index.d.ts",
      },
      default: "./src/schemas/index.ts",
    };
  });
  await updateJsonFile(options.orpcInstaller.tsconfigBuildTypesPath, (json) => {
    if (!json.include) {
      json.include = [];
    }
    json.include.push("src/schemas/index.ts");
  });
}
