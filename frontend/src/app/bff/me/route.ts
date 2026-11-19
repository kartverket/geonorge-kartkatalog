import { jwtDecode } from "jwt-decode";
import { type NextRequest, NextResponse } from "next/server";
import { clearAuthProviderCookieIfMatches } from "../auth/providerCookie";

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

type AuthDetail = {
  authorized_parties: AuthParty[];
  resource?: string;
  type?: string;
  resource_name?: string;
};

type AuthParty = {
  orgno: OrgNo;
  resource?: string;
  name?: string;
  unit_type?: string;
  action?: string[];
};

type OrgNo = {
  ID: string;
  authority: string;
};
function getGetOrgNameFromToken(request: NextRequest): string | null {
  const tokenString = request.cookies.get("BearerToken")?.value;
  if (!tokenString) return null;
  // biome-ignore lint/suspicious/noExplicitAny: <for local stuff when forwarding does not work and token is unencrypted>
  const decodedToken = jwtDecode(tokenString) as Record<string, any>;

  const authDetails = decodedToken?.authorization_details as
    | AuthDetail[]
    | undefined;
  if (!authDetails?.length) return null;

  for (const details of authDetails) {
    const authorizedParties = details.authorized_parties;
    if (!Array.isArray(authorizedParties) || !isRecord(authorizedParties[0])) {
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
  }
  return null;
}

function getNameFromToken(request: NextRequest): string | null {
  const tokenString = request.cookies.get("BearerToken")?.value;
  if (!tokenString) return null;
  // biome-ignore lint/suspicious/noExplicitAny: <for local stuff when forwarding does not work and token is unencrypted>
  const decodedToken = jwtDecode(tokenString) as Record<string, any>;

  const name = decodedToken?.name;
  if (typeof name === "string" && name.trim()) {
    return name;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const rawName = request.headers.get("x-user-full-name");
  let name = rawName ? decodeUtf8Header(rawName) : rawName;
  let organizationName = getOrganizationName(
    request.headers.get("x-auth-details"),
  );
  if (!organizationName) {
    organizationName = getGetOrgNameFromToken(request);
  }
  if (!name?.trim()) {
    name = getNameFromToken(request);
  }

  if (!name || !organizationName) {
    const response = NextResponse.json({ authenticated: false });
    clearAuthProviderCookieIfMatches(request, response, "ansattporten");
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: { name, organizationName },
  });
}
