import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("BearerToken")?.value;
  const authProvider = request.cookies.get("KARTKATALOG_AUTH_PROVIDER")?.value;

  if (token && authProvider === "mock") {
    console.log("Mock authentication successful");
    return NextResponse.json({
      authenticated: true,
      user: {
        name: "Mock McMockesnen",
        organizationName: "Organisasjonen min",
      },
    });
  }
  return NextResponse.json({ authenticated: false });
}
