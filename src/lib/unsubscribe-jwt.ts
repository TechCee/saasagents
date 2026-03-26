import * as jose from "jose";

const ISSUER = "command-center";
const AUDIENCE = "unsubscribe";

export type UnsubscribePayload = {
  email: string;
  organisation_id: string;
};

function getSecret() {
  const s = process.env.UNSUBSCRIBE_JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("UNSUBSCRIBE_JWT_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(s);
}

export async function signUnsubscribeToken(
  payload: UnsubscribePayload,
  maxAgeSec = 60 * 60 * 24 * 365,
) {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getSecret());
}

export async function verifyUnsubscribeToken(token: string) {
  const { payload } = await jose.jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  const email = String(payload.email ?? "");
  const organisation_id = String(payload.organisation_id ?? "");
  if (!email || !organisation_id) return null;
  return { email: email.toLowerCase(), organisation_id } satisfies UnsubscribePayload;
}
