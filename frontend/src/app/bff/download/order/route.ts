import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError, orderDownload } from "@/app/api";
import { parseDownloadOrderRequest } from "@/lib/schemas/download";

export async function POST(request: Request) {
  try {
    const body = parseDownloadOrderRequest(await request.json());
    const result = await orderDownload(
      body,
      request.headers.get("cookie") ?? undefined,
    );
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
