# VetCare Management API

Backend API for the VetCare Management platform.

## Technologies

- Node.js LTS
- NestJS
- TypeScript
- npm
- ESLint
- Prettier
- Jest
- Swagger
- ConfigModule
- Environment variables with `.env`

## Getting Started

```bash
npm install
npm run start:dev
```

The API starts on `http://localhost:3000` by default.

Swagger documentation is available at `http://localhost:3000/docs`.

## Main Commands

```bash
npm run start:dev
npm run build
npm run lint
npm run test
```

## Development Authentication

Local login is available only when `AUTH_PROVIDER=development` and `NODE_ENV`
is `development` or `test`. Configure these values locally without committing secrets:

```bash
AUTH_PROVIDER=development
DEVELOPMENT_AUTH_EMAIL=receptionist@vetcare.local
DEVELOPMENT_AUTH_PASSWORD=
DEVELOPMENT_AUTH_JWT_SECRET=
DEVELOPMENT_AUTH_TOKEN_TTL_SECONDS=3600
```

`POST /api/auth/login` returns a short-lived Bearer access token for local
development and tests. Passwords are never returned, logged or stored in the
token. Development authentication is forcibly unavailable in production.

### Future ZITADEL Integration

The production identity flow will use OAuth 2.0 and OpenID Connect with
ZITADEL. The React application will initiate Authorization Code with PKCE
directly against ZITADEL. After login, React will send the access token to the
NestJS API using the `Authorization: Bearer <token>` header.

NestJS will replace the development provider with a future
`ZitadelIdentityProvider` that validates JWT access tokens through JWKS, issuer,
audience, expiration, subject and authorized roles or claims. The user's
password must not pass through NestJS in the real integration.

## Basic Structure

```text
src/
  app.controller.ts
  app.module.ts
  auth/
  app.service.ts
  main.ts
test/
  app.e2e-spec.ts
  jest-e2e.json
```
