import { type NextRequest, NextResponse } from "next/server";
import { getSearchResults, HttpError } from "@/app/api";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const text = params.get("text") ?? undefined;
  const orderby = params.get("orderby") ?? "score";
  const limit = Number(params.get("limit")) || 25;
  const offset = Number(params.get("offset")) || 1;

  try {
    const searchResult = await getSearchResults({
      text,
      orderby,
      limit,
      offset,
    });

    return NextResponse.json(searchResult);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        {
          error: error.message,
          body: error.body,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: "Could not fetch search results.",
      },
      { status: 500 },
    );
  }
}
