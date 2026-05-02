import fs from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";
import { TEMPLATE_ROOT } from "../consts";
import { updateJsonFile } from "../helpers/json-file";
import { NextLayoutFile } from "../helpers/next-layout-file";
import Versions from "../versions.json";
import type { BetterAuthInstaller } from "./better-auth-installer";
import type { DatabaseInstaller } from "./database-installer";
import type { DesignSystemInstaller } from "./design-system-installer";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import type { NextAppInstaller } from "./next-app-installer";
import type { OrpcInstaller } from "./orpc-installer";
import type { PlaywrightInstaller } from "./playwright-installer";
import { TurboPackageInstaller } from "./turbo-package-installer";

type InstallRealWorldAppOptions = {
  nextAppInstaller: NextAppInstaller;
  designSystemInstaller: DesignSystemInstaller;
  playwrightInstaller: PlaywrightInstaller;
  orpcInstaller: OrpcInstaller;
  databaseInstaller: DatabaseInstaller;
  betterAuthInstaller: BetterAuthInstaller;
  monoRepoInstaller: MonoRepoInstaller;
};

export async function installRealWorldApp(options: InstallRealWorldAppOptions) {
  if (!options.betterAuthInstaller.caslInstaller) {
    throw new Error("CASL installer must be initialized before installing the real world app");
  }

  const nextTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "next");
  await fs.cp(nextTemplateRoot, options.nextAppInstaller.nextAppRootPath, { recursive: true });

  const playwrightTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "e2e");
  await fs.cp(playwrightTemplateRoot, options.playwrightInstaller.rootPath, { recursive: true });

  const apiTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "api");
  await fs.cp(apiTemplateRoot, options.orpcInstaller.getRootPath(), { recursive: true });

  const rbacTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "rbac");
  await fs.cp(rbacTemplateRoot, resolve(options.betterAuthInstaller.caslInstaller.getRootPath(), "rbac"), {
    recursive: true,
  });

  //database
  const prismaSchema = await options.databaseInstaller.getPrismaSchema();
  prismaSchema
    .getModelByNameOrThrow("User")
    .content.push({ kind: "field", content: "bio    String?" }, { kind: "field", content: "articles Article[]" });
  prismaSchema.schema.push({
    kind: "model",
    name: "Tag",
    content: [
      { kind: "field", content: "id String @id" },
      { kind: "field", content: "name String @unique" },
      { kind: "field", content: `createdAt DateTime @map("created_at")` },
      { kind: "field", content: "tagArticles Tag_Article[]" },
      { kind: "modelAttribute", content: `@@map("tag")` },
    ],
  });
  prismaSchema.schema.push({
    kind: "model",
    name: "Tag_Article",
    content: [
      { kind: "field", content: `articleId String @map("article_id")` },
      { kind: "field", content: `tagId String @map("tag_id")` },
      { kind: "field", content: "article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)" },
      { kind: "field", content: "tag Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)" },
      { kind: "modelAttribute", content: `@@id([articleId, tagId])` },
      { kind: "modelAttribute", content: `@@map("tag_article")` },
    ],
  });
  prismaSchema.schema.push({
    kind: "model",
    name: "Article",
    content: [
      { kind: "field", content: "id String @id" },
      { kind: "field", content: "title String" },
      { kind: "field", content: "description String" },
      { kind: "field", content: "body String" },
      { kind: "field", content: `createdAt DateTime @map("created_at")` },
      { kind: "field", content: `updatedAt DateTime @map("updated_at")` },
      { kind: "field", content: `authorId String @map("author_id")` },
      { kind: "field", content: "author User @relation(fields: [authorId], references: [id], onDelete: Cascade)" },
      { kind: "field", content: "tags Tag_Article[]" },
      { kind: "modelAttribute", content: `@@map("article")` },
    ],
  });
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
  await options.orpcInstaller.addDependencyToPackageJson("@paralleldrive/cuid2", Versions["@paralleldrive/cuid2"]);
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

  //Setup Worker Thread
  const workerThreadPackage = await TurboPackageInstaller.create({
    name: "worker-thread",
    subPath: "worker-thread",
    packageKind: "PACKAGE_WITH_BUILD",
    monoRepoInstaller: options.monoRepoInstaller,
  });
  await workerThreadPackage.addDependencyToPackageJson("@repo/database", "workspace:*");
  await workerThreadPackage.addDependencyToPackageJson("drizzle-orm", Versions["drizzle-orm"]);
  await workerThreadPackage.addDependencyToPackageJson("pg", Versions.pg);
  await workerThreadPackage.addDependencyToPackageJson("tinypool", Versions.tinypool);
  await workerThreadPackage.addDevDependencyToPackageJson("@types/pg", Versions["@types/pg"]);
  await workerThreadPackage.addDevDependencyToPackageJson("tsup", Versions.tsup);
  await workerThreadPackage.addDevDependencyToPackageJson("typescript", Versions.typescript);
  await workerThreadPackage.addScriptToPackageJson("dev", "tsc -p tsconfig.build-types.json --watch & tsup --watch");
  await workerThreadPackage.addScriptToPackageJson("build", "tsc -p tsconfig.build-types.json && tsup");
  await updateJsonFile(workerThreadPackage.packageJsonPath, (json) => {
    json.exports = json.exports ?? {};
    json.exports["."] = json.exports["."] ?? {};
    json.exports["."].default = "./dist/index.js";
    json.exports["."]["vs-code-lsp"] = json.exports["."]["vs-code-lsp"] ?? {};
    json.exports["."]["vs-code-lsp"].types = "./dist/index.d.ts";
  });
  await updateJsonFile(workerThreadPackage.tsconfigBuildTypesPath, (json) => {
    json.compilerOptions = json.compilerOptions ?? {};
    json.compilerOptions.rootDir = "./src";
  });
  await updateJsonFile(options.monoRepoInstaller.rootPackageJsonPath, (json) => {
    json.scripts = json.scripts ?? {};
    const currentDevCommand = json.scripts.dev;
    if (!currentDevCommand || typeof currentDevCommand !== "string") {
      throw new Error("Existing dev command must be a string");
    }
    json.scripts.dev = `${currentDevCommand} --filter=@repo/worker-thread`;
  });
  const workerThreadTemplateRoot = resolve(TEMPLATE_ROOT, "real-world-exemple", "worker-thread");
  await fs.cp(workerThreadTemplateRoot, workerThreadPackage.path, { recursive: true });

  await options.nextAppInstaller.addDependencyToPackageJson("@repo/worker-thread", "workspace:*");
  await options.orpcInstaller.addDependencyToPackageJson("@repo/worker-thread", "workspace:*");

  const nextConfigFile = await options.nextAppInstaller.getNextConfigFile();
  nextConfigFile.getNextConfigObject().addPropertyAssignment({
    name: "serverExternalPackages",
    initializer: `["@repo/worker-thread", "tinypool"]`,
  });
  await nextConfigFile.save();

  const nextInstrumentationFile = await options.nextAppInstaller.getNextInstrumentationFile();
  nextInstrumentationFile.makeRegisterFunctionAsync();
  nextInstrumentationFile.addStatementsToRegisterFunction([
    `
    if (process.env.NEXT_RUNTIME === "nodejs") {
    const { destroyWorkerPool } = await import("@repo/worker-thread");

    const shutdown = async () => {
      await destroyWorkerPool();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  }`,
  ]);
  await nextInstrumentationFile.save();
}
