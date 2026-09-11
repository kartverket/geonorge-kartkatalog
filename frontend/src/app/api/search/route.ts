import { type NextRequest, NextResponse } from "next/server";
import { getSearchResults, HttpError } from "@/app/api";
import { RESERVED_SEARCH_PARAMS } from "@/lib/facets";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const text = params.get("text") ?? undefined;
  const orderby = params.get("orderby") ?? "score";
  const limit = Number(params.get("limit")) || 25;
  const offset = Number(params.get("offset")) || 1;

  const filters: Record<string, string[]> = {};
  for (const key of new Set(params.keys())) {
    if (RESERVED_SEARCH_PARAMS.has(key)) continue;
    filters[key] = params.getAll(key);
  }

  try {
    const searchResult = await getSearchResults({
      text,
      orderby,
      limit,
      offset,
      filters,
    });

    return NextResponse.json(searchResult);
  } catch (error) {
    if (error instanceof HttpError) {
      const isProd = process.env.NODE_ENV === "production";
      return NextResponse.json(
        isProd
          ? { error: error.message }
          : { error: error.message, body: error.body },
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
