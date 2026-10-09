import { type NextRequest, NextResponse } from "next/server";
import { clearAuthProviderCookie } from "../auth/providerCookie";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeUtf8Header(value: string): string {
  const decoded = Buffer.from(value, "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? value : decoded;
}

function getOrganizationName(authDetailsHeader: string | null): string | null {
  if (!authDetailsHeader?.trim()) return null;

  const authDetails = authDetailsHeader.trim();
  const candidates = [
    authDetails,
    Buffer.from(authDetails, "base64").toString("utf8"),
  ];

  for (const candidate of candidates) {
    try {
      const details: unknown = JSON.parse(candidate);
      if (!Array.isArray(details) || !isRecord(details[0])) continue;

      const authorizedParties = details[0].authorized_parties;
      if (
        !Array.isArray(authorizedParties) ||
        !isRecord(authorizedParties[0])
      ) {
        continue;
      }

      const party = authorizedParties[0];
      if (!isRecord(party.orgno)) continue;

      const organizationId = party.orgno.ID;
      const name = party.name;
      if (
        typeof organizationId === "string" &&
        /^[^:]+:\d{9}$/.test(organizationId) &&
        typeof name === "string" &&
        name.trim()
      ) {
        return name;
      }
    } catch {
      // Try the other supported representation, then treat malformed data as absent.
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const rawName = request.headers.get("X-User-Full-Name");
  const name = rawName ? decodeUtf8Header(rawName) : rawName;
  const organizationName = getOrganizationName(
    request.headers.get("X-Auth-Details"),
  );

  if (!name?.trim() || !organizationName) {
    const response = NextResponse.json({ authenticated: false });
    clearAuthProviderCookie(response);
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: { name, organizationName },
  });
}
