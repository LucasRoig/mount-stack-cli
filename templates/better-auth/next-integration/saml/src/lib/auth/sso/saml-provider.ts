import type { HookRequest } from "./hook-request";
import { getEnv } from "@/env/env";
import type { SAMLConfig } from "@better-auth/sso";
import { Constants, SamlLib } from "samlify";
import { isReturnedUrlInContext } from "./utils";

type BetterAuthSamlProviderConfig = {
  domain: string;
  providerId: string;
  samlConfig: SAMLConfig;
}

type SamlProviderConfig = {
  providerId: string;
  issuer: string;
  ipd: {
    ssoLoginUrl: string;
    certificate: string;
  },
  sp: {
    entityID: string;
    authnRequestsSigned?: {
      enabled: true,
      privateKey: string;
    } | {
      enabled: false;
    };
  }
  mapping?: SAMLConfig["mapping"];
}

export class SAMLProvider {
  private static SAML_FORCE_AUTHN = 'ForceAuthn="true"';

  public get providerId() {
    return this.config.providerId;
  }
  constructor(private config: SamlProviderConfig) { }

  public beforeHook(req: HookRequest) {
    if (req.query?.forceLogin === "true") {
      const defaultTemplate = SamlLib.defaultLoginRequestTemplate;
      defaultTemplate.context = defaultTemplate.context.replace('>', ` ${SAMLProvider.SAML_FORCE_AUTHN}>`);
    }
  }

  public afterHook(req: HookRequest) {
    if (this.config.sp.authnRequestsSigned?.enabled && isReturnedUrlInContext(req.context.returned)) {
      //check if there is a signature in the request. If there is modify it to include the relayState in the signature, better auth doesn't handle the relayState in the signature
      const url = new URL(req.context.returned.url);
      const relayState = url.searchParams.get("RelayState");
      if (relayState) {
        const algorithm = url.searchParams.get("SigAlg");
        const samlRequest = url.searchParams.get("SAMLRequest");
        let payloadToSign = `SAMLRequest=${encodeURIComponent(samlRequest || "")}`;
        if (relayState) {
          payloadToSign += `&RelayState=${encodeURIComponent(relayState)}`;
        }
        payloadToSign += `&SigAlg=${encodeURIComponent(algorithm || "")}`;
        const newSignature = SamlLib.constructMessageSignature(payloadToSign, this.config.sp.authnRequestsSigned.privateKey, undefined, undefined, Constants.algorithms.signature.RSA_SHA256);
        url.searchParams.set("Signature", newSignature.toString())
        req.context.returned.url = url.toString();
      }
    }
    if (req.query?.forceLogin === "true") {
      const defaultTemplate = SamlLib.defaultLoginRequestTemplate;
      defaultTemplate.context = defaultTemplate.context.replace(SAMLProvider.SAML_FORCE_AUTHN, "");
    }
  }

  public getBetterAuthConfig(): BetterAuthSamlProviderConfig {
    const url = new URL(getEnv().server.BETTER_AUTH_URL);
    const domain = url.hostname;
    return {
      domain,
      providerId: this.config.providerId,
      samlConfig: {
        entryPoint: this.config.ipd.ssoLoginUrl,
        issuer: this.config.issuer,
        callbackUrl: `${url.toString()}api/auth/sso/saml2/sp/acs/${this.config.providerId}`,
        cert: this.config.ipd.certificate,
        authnRequestsSigned: this.config.sp.authnRequestsSigned?.enabled ?? false,
        spMetadata: {
          entityID: this.config.sp.entityID,
          privateKey: this.config.sp.authnRequestsSigned?.enabled ? this.config.sp.authnRequestsSigned.privateKey : undefined,
        },
        mapping: this.config.mapping,
      }
    }
  }
}
