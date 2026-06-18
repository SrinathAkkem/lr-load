import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toLR } from "@/lib/db/serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const row = await prisma.lRRequest.findUnique({
    where: { qrCode: code },
    include: { company: true },
  });
  if (!row) return jsonError("LR not found", 404);

  const lr = toLR(row);
  const company = row.company;

  const publicStatus =
    lr.status === "delivered"
      ? "Delivered"
      : lr.status === "approved" || lr.status === "in_transit"
        ? "In Transit"
        : lr.status;

  return jsonOk({
    lrNumber: lr.lrNumber ?? lr.trackingId,
    company: {
      name: company.name,
      logoUrl: company.logoUrl ?? null,
      gstNumber: company.gstNumber,
    },
    consignorName: lr.consignorName,
    consignorAddress: lr.consignorAddress,
    consigneeName: lr.consigneeName,
    consigneeAddress: lr.consigneeAddress,
    goodsDescription: lr.goodsDescription,
    noOfPackages: lr.noOfPackages,
    weightKg: lr.weightKg,
    freightAmount: lr.freightAmount,
    paymentMode: lr.paymentMode,
    vehicleNumber: lr.vehicleNumber,
    dispatchDate: lr.dispatchDate,
    originCity: lr.originCity,
    destinationCity: lr.destinationCity,
    status: publicStatus,
    pdfUrl: lr.pdfUrl,
  });
}
