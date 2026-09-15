import { NextResponse } from "next/server";
import { getMetadata, HttpError } from "@/app/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params;

  try {
    const metadata = await getMetadata(uuid);
    return NextResponse.json(metadata);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not fetch metadata." },
      { status: 500 },
    );
  }
}

