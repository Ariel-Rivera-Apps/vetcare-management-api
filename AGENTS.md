# Project

VetCare Management API built with NestJS and TypeScript.

# Branching

- Work from `dev`.
- Use feature branches for functional modules.
- Never push directly to `main`.
- Create or update a pull request from `dev` to `main`.
- Never force-push.
- Never merge to `main` unless explicitly requested.

# Required Validation

Before committing, run:

- `npm run lint`
- `npm run build`
- `npm test -- --runInBand`
- `npm run test:e2e -- --runInBand`

Do not commit when required validations fail.

# Architecture

- Controllers handle HTTP concerns only.
- Services contain application logic.
- Guards handle route access.
- Strategies or providers handle identity-provider integration.
- DTOs validate external input.
- No database or identity-provider logic in controllers.
- Environment-specific values must come from configuration.
- Do not expose persistence entities directly.

# Security

- Never commit passwords, tokens, API keys, client secrets or `.env` files.
- Never log credentials or complete authorization headers.
- Never enable mock authentication in production.
- Validate token signature, issuer, audience and expiration when integrating OIDC.
- Use access tokens, not ID tokens, to authorize API requests.
- Prefer Authorization Code with PKCE for the React application.

# Code Conventions

- TypeScript strict typing.
- Do not use `any` unless technically unavoidable and documented.
- Use dependency injection.
- Use Conventional Commits.
- Keep changes within the requested module.
- Add Swagger decorators to public API contracts.
- Add tests for success, validation and failure paths.

# Agent Execution

- Work autonomously on routine tasks.
- Do not request confirmation for editing, npm commands, tests, builds, commits, pushes or PR creation when requested.
- Stop before destructive, irreversible or security-sensitive actions.
