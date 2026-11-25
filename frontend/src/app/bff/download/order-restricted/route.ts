import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError, orderDownload } from "@/app/api";
import { parseDownloadOrderRequest } from "@/lib/schemas/download";

function getCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  const match = cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? match[2] : undefined;
}

export async function POST(request: Request) {
  const authCookie = getCookie(request, "BearerToken");
  const cookie = request.headers.get("cookie");

  try {
    const body = parseDownloadOrderRequest(await request.json());
    const result = await orderDownload(body, cookie ?? undefined, authCookie);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid download order." },
        { status: 400 },
      );
    }

    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not order download." },
      { status: 500 },
    );
  }
}
