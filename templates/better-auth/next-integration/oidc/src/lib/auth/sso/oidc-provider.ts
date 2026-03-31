import type { OIDCConfig } from "@better-auth/sso";
import type { HookRequest } from "./hook-request";
import { getEnv } from "@/env/env";
import { isReturnedUrlInContext } from "./utils";

type BetterAuthOidcProviderConfig = {
  domain: string;
  providerId: string;
  oidcConfig: OIDCConfig;
}

type OIDCProviderConfig = {
  providerId: string;
  oidc: {
    clientId: string;
    clientSecret: string;
    discoveryEndpoint: string;
    issuer: string;
    pkce: boolean;
  }
}

export class OIDCProvider {
  public get providerId() {
    return this.config.providerId;
  }

  public beforeHook(_req: HookRequest) {

  }

  public afterHook(req: HookRequest) {
    if (req.query?.forceLogin === "true" && isReturnedUrlInContext(req.context.returned)) {
      req.context.returned.url += "&prompt=login";
    }
  }

  constructor(private config: OIDCProviderConfig) { }
  public getBetterAuthConfig(): BetterAuthOidcProviderConfig {
    const url = new URL(getEnv().server.BETTER_AUTH_URL);
    const domain = url.hostname;
    return {
      domain,
      providerId: this.config.providerId,
      oidcConfig: {
        clientId: this.config.oidc.clientId,
        clientSecret: this.config.oidc.clientSecret,
        discoveryEndpoint: this.config.oidc.discoveryEndpoint,
        issuer: this.config.oidc.issuer,
        pkce: this.config.oidc.pkce,
      }
    }
  }
}
