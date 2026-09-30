import { NextResponse } from "next/server";
import { getDownloadOptions, HttpError } from "@/app/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params;
  const capabilitiesUrl =
    new URL(request.url).searchParams.get("capabilitiesUrl") ?? "";

  try {
    const options = await getDownloadOptions(uuid, capabilitiesUrl);
    return NextResponse.json(options);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Invalid download options response from backend." },
      { status: 502 },
    );
  }
}
