import { NextResponse } from "next/server";
import { HttpError, orderDownload } from "@/app/api";
import type { DownloadOrderItemInput } from "@/lib/schemas/download";

export async function POST(request: Request) {
  const body: {
    email: string;
    usageGroup: string;
    items: DownloadOrderItemInput[];
  } = await request.json();

  try {
    const result = await orderDownload(body);
    return NextResponse.json(result);
  } catch (error) {
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
