import { NextRequest, NextResponse } from "next/server";
import { getUpload } from "@/lib/storage/local-storage";

export const dynamic = "force-dynamic";

/** Serve uploaded files from MySQL. */
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("u");
  if (!src?.startsWith("/uploads/")) {
    return NextResponse.json(
      { error: "u must be an /uploads/ path" },
      { status: 400 },
    );
  }

  const file = await getUpload(src);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
