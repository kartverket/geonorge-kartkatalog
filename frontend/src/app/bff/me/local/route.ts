import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const enabled = process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED === "true";
  if (!enabled) {
    return NextResponse.json({}, { status: 404 });
  }

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
