import type { JWTPayload } from 'jose';

export interface JwtVerificationOptions {
  issuer: string;
  audience: string;
  algorithms: string[];
}

export interface JwtVerificationResult {
  payload: JWTPayload;
}

export async function verifyJwtWithRemoteJwks(
  accessToken: string,
  jwksUrl: URL,
  options: JwtVerificationOptions,
): Promise<JwtVerificationResult> {
  const { createRemoteJWKSet, jwtVerify } = await import('jose');
  const jwks = createRemoteJWKSet(jwksUrl);
  const { payload } = await jwtVerify(accessToken, jwks, options);

  return { payload };
}
