# Setup Dev

## Start docker compose

`docker compose up -d`

## Run database migrations

* `pnpm db:migrate dev`
* `pnpm db:generate`

## Install playwright

If your are not using e2e tests you can skip this part.

* `pnpm --dir apps/e2e exec playwright install`

## Configure keycloak

If you are not using SSO authentication you can skip this part.

* Login to the admin console on `http://localhost:8080/admin/` default credentials are admin:admin
* Click on manage realms and add a new realm with the name of your choice

### Setup oidc client

If you are not using OIDC authentication you can skip this part

* Inside the newly created realm, click on realm settings and copy the url of the `OIDC Endpoint Configuration`.
* Paste this url inside `apps/web-exemple/env.local` in the `BETTER_AUTH_OIDC_DISCOVERY_ENDPOINT` key

* Click on clients > Create client
* Create a new OIDC Client and paste it's ClientID inside `apps/web-exemple/env.local` in the `BETTER_AUTH_OIDC_CLIENT_ID` key
* Use the following config for the client :
  * Client authentication => ON
  * Root URL => http://localhost:3000
  * Home URL => http://localhost:3000
  * Valid redirect URIs => http://localhost:3000/*
  * Valid post logout redirect URIs => http://localhost:3000/*
  * Web origins => http://localhost:3000
* Go to the credentials tab in the client config and copy the client secret in `apps/web-exemple/env.local` in the `BETTER_AUTH_OIDC_CLIENT_SECRET` key
* Set the `BETTER_AUTH_OIDC_ISSUER` variable to the realm part of the discovery endpoint ex: `http://localhost:8080/realms/my-realm-name`

### Setup SAML client

If you are not using SAML authentication you can skip this part

* Click on realm settings > SAML 2.0 Identity Provider Metadata and find the `SingleSignOnService` in the xml. Copy the location to the `BETTER_AUTH_SAML_IDP_SSO_LOGIN_URL`
* Set the `BETTER_AUTH_SAML_ISSUER` variable to the realm part of the discovery location ex: `http://localhost:8080/realms/my-realm-name`
* Inside the newly created realm, click on realm settings > keys and copy the certificate of the key with alogorithm RS256 and use SIG.
* Paste this key in `apps/web-exemple/certificates/idp-public.pem`. In this file add `-----BEGIN CERTIFICATE-----` on the first line and `-----END CERTIFICATE-----` on the last line
* Create a new SAML Client and paste it's ClientID inside `apps/web-exemple/env.local` in the `BETTER_AUTH_SAML_SP_ENTITY_ID` key
* Use the following config for the client :
  * Root URL => http://localhost:3000
  * Home URL => http://localhost:3000
  * Valid redirect URIs => http://localhost:3000/*
  * Valid post logout redirect URIs => http://localhost:3000/*
* Go to the keys tab in the client config. Under `Signing keys config` click on `Regenerate`, dowload the generated key and paste its content in `apps/web-exemple/certificates/sp-private.pem`. In this file add `-----BEGIN RSA PRIVATE KEY-----` on the first line and `-----END RSA PRIVATE KEY-----` on the last line

## Check docker build

`just build_web-exemple latest`

## Run playwright tests

`pnpm e2e:test`

## Run dev

`pnpm dev`
