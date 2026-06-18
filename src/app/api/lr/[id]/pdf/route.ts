import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest, unauthorized } from "@/lib/api/auth-middleware";
import { jsonError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { generateLrPdf } from "@/lib/pdf/lr-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const { id } = await params;
  const lr = await prisma.lRRequest.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!lr) return jsonError("LR not found", 404);

  if (
    session.role === "driver" &&
    lr.driverId !== session.userId
  ) {
    return jsonError("Forbidden", 403);
  }
  if (
    session.role === "company_admin" &&
    lr.companyId !== session.companyId
  ) {
    return jsonError("Forbidden", 403);
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const bytes = await generateLrPdf(lr, { appUrl });

  const filename = `${lr.lrNumber ?? lr.trackingId}.pdf`.replace(/\//g, "-");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
