import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ts, VariableDeclarationKind } from "ts-morph";
import { TEMPLATE_ROOT } from "../consts";
import { updateJsonFile } from "../helpers/json-file";
import { getSourceFile } from "../helpers/ts-files";
import Versions from "../versions.json";
import { CaslInstaller } from "./casl-installer";
import type { DatabaseInstaller } from "./database-installer";
import type { DockerComposeInstaller } from "./docker-compose-installer";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import { EnvSchemas, EnvVisibilities, type NextAppInstaller } from "./next-app-installer";
import type { OrpcInstaller } from "./orpc-installer";

export type BetterAuthProviders = "email" | "oidc" | "saml";
type BetterAuthInstallerCreateArgs = {
  databaseInstaller: DatabaseInstaller;
  nextAppInstaller: NextAppInstaller;
  orpcInstaller: OrpcInstaller;
  monoRepoInstaller: MonoRepoInstaller;
  dockerComposeInstaller: DockerComposeInstaller;
  providers: BetterAuthProviders[];
  useDatabase: boolean;
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
    await args.nextAppInstaller.addEnvVariable(
      "BETTER_AUTH_SECRET",
      EnvVisibilities.SECRET,
      crypto.randomBytes(32).toString("hex"),
    );
    await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_URL", EnvVisibilities.SERVER, "http://localhost:3000");
    await args.nextAppInstaller.addEnvVariable(
      "BETTER_AUTH_SESSION_DURATION_IN_SECONDS",
      EnvVisibilities.SERVER,
      "3600",
      { schema: EnvSchemas.PositiveInt },
    );

    const routeFile = await args.nextAppInstaller.getRouteFile();
    routeFile
      .getVariableStatementOrThrow("Routes")
      .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclarationList)
      .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclaration)
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
      .addPropertyAssignment({
        name: "auth",
        initializer: `{
          signIn: "/auth/sign-in"
        }`,
      });
    routeFile.formatText();
    await routeFile.save();

    const coreSrcTemplatePath = path.resolve(TEMPLATE_ROOT, "better-auth", "next-integration", "core", "src");
    await fs.cp(coreSrcTemplatePath, args.nextAppInstaller.srcPath, { recursive: true });

    await updateJsonFile(args.nextAppInstaller.i18nFiles.fr, (data) => {
      data.authErrors = {
        USER_ALREADY_EXISTS: "Utilisateur déjà enregistré",
        INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe invalide",
        USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un utilisateur avec cet email existe déjà.",
      };
    });

    const enableSsoPlugin = args.providers.includes("oidc") || args.providers.includes("saml");
    const clientFile = await getSourceFile(
      path.resolve(args.nextAppInstaller.srcPath, "lib", "auth", "auth-client.ts"),
    );
    const authFile = await getSourceFile(path.resolve(args.nextAppInstaller.srcPath, "lib", "auth", "auth.ts"));
    const createBaseAuthConfigFunctionBlock = authFile
      .getFunctionOrThrow("createBaseAuthConfig")
      .getFirstChildByKindOrThrow(ts.SyntaxKind.Block);
    const baseAuthConfigDeclaration = createBaseAuthConfigFunctionBlock
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ReturnStatement)
      .getFirstChildByKindOrThrow(ts.SyntaxKind.SatisfiesExpression)
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);

    if (args.useDatabase) {
      await args.nextAppInstaller.addDependencyToPackageJson("@paralleldrive/cuid2", Versions["@paralleldrive/cuid2"]);
      authFile.insertImportDeclaration(1, {
        namedImports: ["drizzleAdapter"],
        moduleSpecifier: "better-auth/adapters/drizzle",
      });
      authFile.insertImportDeclaration(2, {
        namedImports: ["getDatabaseClient"],
        moduleSpecifier: "../database",
      });
      authFile.insertImportDeclaration(3, {
        namedImports: ["createId"],
        moduleSpecifier: "@paralleldrive/cuid2",
      });

      baseAuthConfigDeclaration.addPropertyAssignments([
        {
          name: "database",
          initializer: `drizzleAdapter(getDatabaseClient(), {
                          provider: "pg", // or "mysql", "sqlite"
                          usePlural: true,
                        })`,
        },
        {
          name: "advanced",
          initializer: `{
                          database: {
                            generateId: () => createId(),
                          }
                        }`,
        },
      ]);

      const prismaSchema = await args.databaseInstaller.getPrismaSchema();
      prismaSchema.schema.push({
        kind: "model",
        name: "User",
        content: [
          { kind: "field", content: "id            String        @id" },
          { kind: "field", content: "name          String" },
          { kind: "field", content: "email         String" },
          { kind: "field", content: 'emailVerified Boolean       @map("email_verified")' },
          { kind: "field", content: "image         String?" },
          { kind: "field", content: 'createdAt     DateTime      @map("created_at")' },
          { kind: "field", content: 'updatedAt     DateTime      @map("updated_at")' },
          { kind: "field", content: "sessions      Session[]" },
          { kind: "field", content: "accounts      Account[]" },
          { kind: "field", content: "role          Role          @default(USER)" },
          { kind: "modelAttribute", content: '@@map("user")' },
        ],
      });
      prismaSchema.schema.push({
        kind: "enum",
        name: "Role",
        content: `
          USER
          ADMIN
        `,
      });
      prismaSchema.schema.push({
        kind: "model",
        name: "Session",
        content: [
          { kind: "field", content: "id        String   @id" },
          {
            kind: "field",
            content: "user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)",
          },
          { kind: "field", content: "userId    String" },
          { kind: "field", content: "token     String" },
          { kind: "field", content: 'expiresAt DateTime @map("expires_at")' },
          { kind: "field", content: 'ipAddress String?  @map("ip_address")' },
          { kind: "field", content: 'userAgent String?  @map("user_agent")' },
          { kind: "field", content: 'createdAt DateTime @map("created_at")' },
          { kind: "field", content: 'updatedAt DateTime @map("updated_at")' },
          { kind: "modelAttribute", content: '@@map("session")' },
        ],
      });
      prismaSchema.schema.push({
        kind: "model",
        name: "Account",
        content: [
          { kind: "field", content: "id                    String    @id" },
          {
            kind: "field",
            content: "user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)",
          },
          { kind: "field", content: 'userId                String    @map("user_id")' },
          { kind: "field", content: 'accountId             String    @map("account_id")' },
          { kind: "field", content: 'providerId            String    @map("provider_id")' },
          { kind: "field", content: 'accessToken           String?   @map("access_token")' },
          { kind: "field", content: 'refreshToken          String?   @map("refresh_token")' },
          { kind: "field", content: 'accessTokenExpiresAt  DateTime? @map("access_token_expires_at")' },
          { kind: "field", content: 'refreshTokenExpiresAt DateTime? @map("refresh_token_expires_at")' },
          { kind: "field", content: "scope                 String?" },
          { kind: "field", content: 'idToken               String?   @map("id_token")' },
          { kind: "field", content: "password              String?" },
          { kind: "field", content: 'createdAt             DateTime  @map("created_at")' },
          { kind: "field", content: 'updatedAt             DateTime  @map("updated_at")' },
          { kind: "modelAttribute", content: '@@map("account")' },
        ],
      });
      prismaSchema.schema.push({
        kind: "model",
        name: "Verification",
        content: [
          { kind: "field", content: "id         String   @id" },
          { kind: "field", content: "identifier String" },
          { kind: "field", content: "value      String" },
          { kind: "field", content: 'expiresAt  DateTime @map("expires_at")' },
          { kind: "field", content: 'createdAt  DateTime @map("created_at")' },
          { kind: "field", content: 'updatedAt  DateTime @map("updated_at")' },
          { kind: "modelAttribute", content: '@@map("verification")' },
        ],
      });
      if (enableSsoPlugin) {
        prismaSchema.schema.push({
          kind: "model",
          name: "SSOProvider",
          content: [
            { kind: "field", content: "id             String @id" },
            { kind: "field", content: "issuer         String" },
            { kind: "field", content: "domain         String" },
            { kind: "field", content: 'oidcConfig     String @map("oidc_config")' },
            { kind: "field", content: 'samlConfig     String @map("saml_config")' },
            { kind: "field", content: 'userId         String @map("user_id")' },
            {
              kind: "field",
              content: "user           User   @relation(fields: [userId], references: [id], onDelete: Cascade)",
            },
            { kind: "field", content: 'providerId     String @map("provider_id")' },
            { kind: "field", content: 'organizationId String @map("organization_id")' },
            { kind: "modelAttribute", content: '@@map("sso_provider")' },
          ],
        });
        prismaSchema
          .getModelByNameOrThrow("User")
          .content.push({ kind: "field", content: "ssoProviders    SSOProvider[]" });
      }

      await prismaSchema.save();
      await CaslInstaller.create({
        monoRepoInstaller: args.monoRepoInstaller,
      });
    }

    if (args.providers.includes("email")) {
      await args.nextAppInstaller.addDependencyToPackageJson("@node-rs/argon2", Versions["@node-rs/argon2"]);
      authFile.insertImportDeclaration(1, {
        defaultImport: "argon2",
        moduleSpecifier: "@node-rs/argon2",
      });
      baseAuthConfigDeclaration.addPropertyAssignment({
        name: "emailAndPassword",
        initializer: `{
                        enabled: true,
                        password: {
                          hash(password) {
                            return argon2.hash(password);
                          },
                          verify({ hash, password }) {
                            return argon2.verify(hash, password);
                          },
                        }
                      },
        `,
      });
    }

    if (enableSsoPlugin) {
      const ssoSrcTemplatePath = path.resolve(TEMPLATE_ROOT, "better-auth", "next-integration", "sso", "src");
      await fs.cp(ssoSrcTemplatePath, args.nextAppInstaller.srcPath, { recursive: true });

      await args.nextAppInstaller.addDependencyToPackageJson("@better-auth/sso", Versions["@better-auth/sso"]);
      clientFile.insertImportDeclaration(1, {
        namedImports: ["ssoClient"],
        moduleSpecifier: "@better-auth/sso/client",
      });
      const pluginsDeclaration = clientFile
        .getVariableStatementOrThrow((stmt) => {
          try {
            return stmt
              .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclarationList)
              .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclaration)
              .getFirstChildByKindOrThrow(ts.SyntaxKind.CallExpression)
              .getFullText()
              .trim()
              .startsWith("createAuthClient");
          } catch {
            return false;
          }
        })
        .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclarationList)
        .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclaration)
        .getFirstChildByKindOrThrow(ts.SyntaxKind.CallExpression)
        .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
        .getChildrenOfKind(ts.SyntaxKind.PropertyAssignment)
        .find((prop) => prop.getName() === "plugins")
        ?.getFirstChildByKindOrThrow(ts.SyntaxKind.ArrayLiteralExpression);
      if (!pluginsDeclaration) {
        throw new Error("Could not find plugins declaration in auth-client.ts");
      }
      pluginsDeclaration.addElement("ssoClient()");

      authFile.insertImportDeclaration(1, {
        namedImports: ["sso"],
        moduleSpecifier: "@better-auth/sso",
      });
      args.nextAppInstaller.addEnvVariable(
        "BETTER_AUTH_TRUSTED_ORIGINS",
        EnvVisibilities.SERVER,
        "http://localhost:8080",
        { schema: EnvSchemas.StringList },
      );
      baseAuthConfigDeclaration.addPropertyAssignment({
        name: "trustedOrigins",
        initializer: `getEnv().server.BETTER_AUTH_TRUSTED_ORIGINS`,
      });
      const ssoProvidersTypes: string[] = [];
      if (args.providers.includes("oidc")) {
        ssoProvidersTypes.push("OIDCProvider");
      }
      if (args.providers.includes("saml")) {
        ssoProvidersTypes.push("SAMLProvider");
      }
      createBaseAuthConfigFunctionBlock.insertVariableStatement(0, {
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: "SSO_PROVIDERS",
            type: `(${ssoProvidersTypes.join(" | ")})[]`,
            initializer: `[]`,
          },
        ],
      });
      baseAuthConfigDeclaration
        .getPropertyOrThrow("plugins")
        .getFirstChildByKindOrThrow(ts.SyntaxKind.ArrayLiteralExpression)
        .addElement(`
          sso({
            defaultSSO: SSO_PROVIDERS.map((provider) => provider.getBetterAuthConfig())
          })
        `);
      authFile.insertImportDeclaration(1, {
        namedImports: ["createAuthMiddleware"],
        moduleSpecifier: "better-auth/api",
      });

      baseAuthConfigDeclaration.addPropertyAssignment({
        name: "hooks",
        initializer: `{
          before: createAuthMiddleware(async (req) => {
            if (req.path === "/sign-in/sso") {
              const providerId = req.body.providerId;
              if (typeof providerId === "string") {
                const provider = SSO_PROVIDERS.find(p => p.providerId === providerId);
                if (provider) {
                  await provider.beforeHook(req);
                  return;
                }
              }
            }
          }),
          after: createAuthMiddleware(async (req) => {
            if (req.path === "/sign-in/sso") {
              const providerId = req.body.providerId;
              if (typeof providerId === "string") {
                const provider = SSO_PROVIDERS.find(p => p.providerId === providerId);
                if (provider) {
                  await provider.afterHook(req);
                  return;
                }
              }
            }
          }),
        }`,
      });
      // Add Keycloak service to docker-compose
      await args.dockerComposeInstaller.addManagedVolume(`${args.monoRepoInstaller.appName}-keycloak-data`);
      await args.dockerComposeInstaller.addService({
        serviceName: "keycloak",
        containerName: `${args.monoRepoInstaller.appName}-keycloak`,
        image: Versions["keycloak-docker-image"],
        ports: [`8080:8080`],
        environment: {
          KC_BOOTSTRAP_ADMIN_USERNAME: "admin",
          KC_BOOTSTRAP_ADMIN_PASSWORD: "admin",
        },
        volumes: [`${args.monoRepoInstaller.appName}-keycloak-data:/opt/keycloak/data`],
        command: "start-dev --import-realm",
      });
    }

    if (args.providers.includes("oidc")) {
      const oidcSrcTemplatePath = path.resolve(TEMPLATE_ROOT, "better-auth", "next-integration", "oidc", "src");
      await fs.cp(oidcSrcTemplatePath, args.nextAppInstaller.srcPath, { recursive: true });

      authFile.insertImportDeclaration(1, {
        namedImports: ["OIDCProvider"],
        moduleSpecifier: "./sso/oidc-provider",
      });
      await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_OIDC_CLIENT_ID", EnvVisibilities.SERVER);
      await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_OIDC_CLIENT_SECRET", EnvVisibilities.SECRET);
      await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_OIDC_DISCOVERY_ENDPOINT", EnvVisibilities.SERVER);
      await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_OIDC_ISSUER", EnvVisibilities.SERVER);
      const ssoProvidersDeclaration = createBaseAuthConfigFunctionBlock
        .getVariableStatementOrThrow("SSO_PROVIDERS")
        .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclarationList)
        .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclaration)
        .getFirstChildByKindOrThrow(ts.SyntaxKind.ArrayLiteralExpression);
      ssoProvidersDeclaration.addElement(`
        new OIDCProvider({
          providerId: "local-oidc",
          oidc: {
            clientId: getEnv().server.BETTER_AUTH_OIDC_CLIENT_ID,
            clientSecret: getEnv().secrets.BETTER_AUTH_OIDC_CLIENT_SECRET,
            discoveryEndpoint: getEnv().server.BETTER_AUTH_OIDC_DISCOVERY_ENDPOINT,
            issuer: getEnv().server.BETTER_AUTH_OIDC_ISSUER,
            pkce: false,
          }
        })
      `);
    }

    if (args.providers.includes("saml")) {
      await args.nextAppInstaller.addDependencyToPackageJson("samlify", Versions.samlify);
      await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_SAML_ISSUER", EnvVisibilities.SERVER);
      await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_SAML_IDP_SSO_LOGIN_URL", EnvVisibilities.SERVER);
      await args.nextAppInstaller.addEnvVariable("BETTER_AUTH_SAML_SP_ENTITY_ID", EnvVisibilities.SERVER);

      const samlSrcTemplatePath = path.resolve(TEMPLATE_ROOT, "better-auth", "next-integration", "saml", "src");
      await fs.cp(samlSrcTemplatePath, args.nextAppInstaller.srcPath, { recursive: true });
      authFile.insertImportDeclaration(1, {
        defaultImport: "fs",
        moduleSpecifier: "node:fs",
      });
      authFile.insertImportDeclaration(1, {
        namedImports: ["SAMLProvider"],
        moduleSpecifier: "./sso/saml-provider",
      });
      const ssoProvidersDeclaration = createBaseAuthConfigFunctionBlock
        .getVariableStatementOrThrow("SSO_PROVIDERS")
        .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclarationList)
        .getFirstChildByKindOrThrow(ts.SyntaxKind.VariableDeclaration)
        .getFirstChildByKindOrThrow(ts.SyntaxKind.ArrayLiteralExpression);
      ssoProvidersDeclaration.addElement(`
        new SAMLProvider({
          providerId: "local-saml",
          issuer: getEnv().server.BETTER_AUTH_SAML_ISSUER,
          ipd: {
            ssoLoginUrl: getEnv().server.BETTER_AUTH_SAML_IDP_SSO_LOGIN_URL,
            certificate: fs.readFileSync(\`certificates/idp-public.pem\`).toString(),
          },
          sp: {
            entityID: getEnv().server.BETTER_AUTH_SAML_SP_ENTITY_ID,
            authnRequestsSigned: {
              enabled: true,
              privateKey: fs.readFileSync(\`certificates/sp-private.pem\`).toString(),
            }
          },
          mapping: {
            id: "nameID",
            email: "email",
            name: "displayName",
          },
        }),
      `);
    }

    await args.orpcInstaller.setupAuthProcedure();
    const orpcContextFile = await args.orpcInstaller.getContextProviderFile();
    orpcContextFile.insertImportDeclarations(1, [
      { namedImports: ["getAuth"], moduleSpecifier: "../auth/auth" },
      { namedImports: ["headers"], moduleSpecifier: "next/headers" },
    ]);
    const getOrpcContextFunctionBlock = orpcContextFile
      .getFunctionOrThrow("getORPCContext")
      .getFirstChildByKindOrThrow(ts.SyntaxKind.Block);
    getOrpcContextFunctionBlock.insertStatements(
      0,
      `
      const session = await getAuth().api.getSession({
        headers: await headers(),
      });
    `,
    );
    getOrpcContextFunctionBlock
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ReturnStatement)
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
      .addProperty("session: session ?? undefined");
    orpcContextFile.formatText();
    await orpcContextFile.save();

    clientFile.formatText();
    await clientFile.save();

    authFile.formatText();
    await authFile.save();
  }
}
