import type {
  Branch,
  Company,
  DashboardStats,
  LRRequest,
  Notification,
  User,
} from "@/lib/types";
import { prisma } from "@/lib/db/prisma";
import {
  paymentModeToDb,
  toBranch,
  toCompany,
  toLR,
  toNotification,
  toUser,
} from "@/lib/db/serialize";
import type { createLRSchema } from "@/lib/validations/lr";
import type { z } from "zod";

type CreateLRInput = z.infer<typeof createLRSchema>;

// ───────────────────── Companies ─────────────────────

export async function getCompanyById(id: string): Promise<Company | null> {
  const c = await prisma.company.findUnique({ where: { id } });
  return c ? toCompany(c) : null;
}

export async function listCompanies(): Promise<Company[]> {
  const rows = await prisma.company.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toCompany);
}

// ───────────────────── Branches ─────────────────────

export async function getBranchesByCompany(companyId: string): Promise<Branch[]> {
  const rows = await prisma.branch.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toBranch);
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const b = await prisma.branch.findUnique({ where: { id } });
  return b ? toBranch(b) : null;
}

// ───────────────────── Users ─────────────────────

export async function getUserById(id: string): Promise<User | null> {
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? toUser(u) : null;
}

export async function getExecutivesByCompany(companyId: string): Promise<User[]> {
  const rows = await prisma.user.findMany({
    where: { companyId, role: "executive" },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toUser);
}

// ───────────────────── LRs ─────────────────────

export async function getLRById(id: string): Promise<LRRequest | null> {
  const lr = await prisma.lRRequest.findUnique({ where: { id } });
  return lr ? toLR(lr) : null;
}

export async function getLRByQrCode(qrCode: string): Promise<LRRequest | null> {
  const lr = await prisma.lRRequest.findUnique({ where: { qrCode } });
  return lr ? toLR(lr) : null;
}

export async function getLRsForUser(
  userId: string,
  role: string,
  companyId: string | null,
): Promise<LRRequest[]> {
  if (role === "executive") {
    const rows = await prisma.lRRequest.findMany({
      where: { executiveId: userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toLR);
  }
  if (role === "company_admin" && companyId) {
    const rows = await prisma.lRRequest.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toLR);
  }
  const rows = await prisma.lRRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toLR);
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfNextMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

export async function computeDashboardStats(
  companyId: string,
): Promise<DashboardStats> {
  const monthStart = startOfMonth();
  const monthEnd = startOfNextMonth();

  const monthLrs = await prisma.lRRequest.findMany({
    where: { companyId, createdAt: { gte: monthStart, lt: monthEnd } },
    select: { status: true, freightAmount: true },
  });

  const pending = monthLrs.filter((lr) => lr.status === "pending").length;
  const approved = monthLrs.filter(
    (lr) => lr.status === "approved" || lr.status === "in_transit",
  ).length;
  const rejected = monthLrs.filter((lr) => lr.status === "rejected").length;
  const delivered = monthLrs.filter((lr) => lr.status === "delivered").length;
  const inTransit = Math.max(0, approved - delivered);
  const freightTotal = monthLrs.reduce(
    (sum, lr) => sum + Number(lr.freightAmount.toString()),
    0,
  );
  const decided = approved + rejected + delivered;
  const approvalRate = decided > 0 ? ((approved + delivered) / decided) * 100 : 0;

  return {
    totalLrs: monthLrs.length,
    pending,
    approved,
    rejected,
    delivered,
    inTransit,
    freightTotal,
    approvalRate,
  };
}

export async function computeDashboardStatsAllTime(
  companyId: string,
): Promise<DashboardStats> {
  const allLrs = await prisma.lRRequest.findMany({
    where: { companyId },
    select: { status: true, freightAmount: true },
  });

  const pending = allLrs.filter((lr) => lr.status === "pending").length;
  const approved = allLrs.filter(
    (lr) => lr.status === "approved" || lr.status === "in_transit",
  ).length;
  const rejected = allLrs.filter((lr) => lr.status === "rejected").length;
  const delivered = allLrs.filter((lr) => lr.status === "delivered").length;
  const inTransit = Math.max(0, approved - delivered);
  const freightTotal = allLrs.reduce(
    (sum, lr) => sum + Number(lr.freightAmount.toString()),
    0,
  );
  const decided = approved + rejected + delivered;
  const approvalRate = decided > 0 ? ((approved + delivered) / decided) * 100 : 0;

  return {
    totalLrs: allLrs.length,
    pending,
    approved,
    rejected,
    delivered,
    inTransit,
    freightTotal,
    approvalRate,
  };
}

export async function generateLRNumber(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");

  // Atomic: upsert + increment in one round-trip so concurrent executive requests
  // can't grab the same serial.
  const serial = await prisma.lRSerial.upsert({
    where: { companyId },
    create: { companyId, counter: 2 },
    update: { counter: { increment: 1 } },
  });

  // The post-increment counter is what the next LR should use, so the current
  // value is `counter - 1`.
  const current = serial.counter - 1;
  const year = new Date().getFullYear();
  return `${company.lrCode}/${year}/${String(current).padStart(4, "0")}`;
}

export async function createLR(
  executiveId: string,
  companyId: string,
  branchId: string,
  input: CreateLRInput,
): Promise<LRRequest> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");
  if (company.status === "suspended") throw new Error("Company is suspended");

  const monthStart = startOfMonth();
  const monthEnd = startOfNextMonth();
  const monthLrCount = await prisma.lRRequest.count({
    where: { companyId, createdAt: { gte: monthStart, lt: monthEnd } },
  });
  if (monthLrCount >= company.maxLrPerMonth) {
    throw new Error("Monthly LR limit reached");
  }

  const trackingId = await generateLRNumber(companyId);
  const qrCode = `qr_${company.lrCode.toLowerCase()}_${Date.now()}`;

  const created = await prisma.lRRequest.create({
    data: {
      lrNumber: null,
      trackingId,
      companyId,
      branchId,
      executiveId,
      consignorName: input.consignorName,
      consignorAddress: input.consignorAddress,
      consigneeCompany: input.consigneeCompany ?? null,
      consigneeName: input.consigneeName,
      consigneeAddress: input.consigneeAddress,
      consigneePhone: input.consigneePhone,
      originCity: input.originCity,
      destinationCity: input.destinationCity,
      vehicleNumber: input.vehicleNumber,
      driverName: input.driverName ?? null,
      driverPhone: input.driverPhone ?? null,
      drivingLicenseNumber: input.drivingLicenseNumber ?? null,
      loadingPoint: input.loadingPoint ?? null,
      unloadingPoint: input.unloadingPoint ?? null,
      goodsDescription: input.goodsDescription,
      noOfPackages: input.noOfPackages,
      weightKg: input.weightKg,
      declaredValue: input.declaredValue,
      freightAmount: input.freightAmount,
      paymentMode: paymentModeToDb(input.paymentMode),
      invoiceNumber: input.invoiceNumber ?? null,
      workOrderNo: input.workOrderNo ?? null,
      insurance: input.insurance ?? null,
      dispatchDate: input.dispatchDate,
      specialInstructions: input.specialInstructions ?? null,
      photos: input.photos ?? [],
      signatureUrl: input.signatureUrl,
      status: "pending",
      qrCode,
    },
  });

  // Notify all company admins for this company.
  const admins = await prisma.user.findMany({
    where: { companyId, role: "company_admin" },
    select: { id: true },
  });
  const executive = await prisma.user.findUnique({ where: { id: executiveId } });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "New LR Request",
        message: `New LR request from ${executive?.name ?? "Executive"}`,
        lrId: created.id,
      })),
    });
  }

  return toLR(created);
}

export async function approveLR(
  lrId: string,
  approverId: string,
): Promise<LRRequest> {
  void approverId; // reserved for future audit logging
  const lr = await prisma.lRRequest.findUnique({ where: { id: lrId } });
  if (!lr) throw new Error("LR not found");
  if (lr.status !== "pending") throw new Error("LR is not pending");

  const updated = await prisma.lRRequest.update({
    where: { id: lrId },
    data: {
      status: "approved",
      lrNumber: lr.trackingId,
      approvedAt: new Date(),
      pdfUrl: `/api/lr/${lr.id}/pdf`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: lr.executiveId,
      title: "Your LR is Approved!",
      message: `LR ${updated.lrNumber} has been approved. Download your PDF now.`,
      lrId: lr.id,
    },
  });

  return toLR(updated);
}

export async function rejectLR(
  lrId: string,
  reason: string,
): Promise<LRRequest> {
  const lr = await prisma.lRRequest.findUnique({ where: { id: lrId } });
  if (!lr) throw new Error("LR not found");
  if (lr.status !== "pending") throw new Error("LR is not pending");

  const updated = await prisma.lRRequest.update({
    where: { id: lrId },
    data: { status: "rejected", rejectionReason: reason },
  });

  await prisma.notification.create({
    data: {
      userId: lr.executiveId,
      title: "LR Rejected",
      message: `LR ${lr.trackingId} was rejected: ${reason}`,
      lrId: lr.id,
    },
  });

  return toLR(updated);
}

export async function markDelivered(
  lrId: string,
  executiveId: string,
): Promise<LRRequest> {
  const lr = await prisma.lRRequest.findUnique({ where: { id: lrId } });
  if (!lr) throw new Error("LR not found");
  if (lr.executiveId !== executiveId) throw new Error("Not authorized");
  if (lr.status !== "approved" && lr.status !== "in_transit") {
    throw new Error("LR cannot be marked delivered");
  }

  const updated = await prisma.lRRequest.update({
    where: { id: lrId },
    data: { status: "delivered", deliveredAt: new Date() },
  });
  return toLR(updated);
}

export async function getTopRoutes(
  companyId: string,
  limit = 5,
): Promise<{ route: string; count: number; freight: number }[]> {
  const lrs = await prisma.lRRequest.findMany({
    where: { companyId, status: { not: "rejected" } },
    select: {
      originCity: true,
      destinationCity: true,
      freightAmount: true,
    },
  });

  const map = new Map<string, { count: number; freight: number }>();
  for (const lr of lrs) {
    const key = `${lr.originCity} → ${lr.destinationCity}`;
    const existing = map.get(key) ?? { count: 0, freight: 0 };
    existing.count += 1;
    existing.freight += Number(lr.freightAmount.toString());
    map.set(key, existing);
  }

  return [...map.entries()]
    .map(([route, data]) => ({ route, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ───────────────────── Time series ─────────────────────

interface TimeSeriesPoint {
  date: string;
  count: number;
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short" });
}

/**
 * Returns an array of {date, count} for the last `days` days. `companyId`
 * scopes to a single company; pass `null` for platform-wide totals (super admin).
 * Uses local IST timezone for date bucketing.
 */
export async function getDailyLrCounts(
  companyId: string | null,
  days = 7,
): Promise<TimeSeriesPoint[]> {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.lRRequest.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      createdAt: { gte: start, lte: end },
    },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  
  // Use local date for bucketing (IST) instead of UTC
  for (const row of rows) {
    const localDate = new Date(row.createdAt);
    const key = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([key, count]) => {
    const d = new Date(key + "T00:00:00");
    return { date: formatDayLabel(d), count };
  });
}

export async function getMonthlyLrCounts(
  companyId: string | null,
  months = 12,
): Promise<TimeSeriesPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const rows = await prisma.lRRequest.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      createdAt: { gte: start },
    },
    select: { createdAt: true },
  });

  const buckets: { key: string; label: string; count: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: formatMonthLabel(d),
      count: 0,
    });
  }
  for (const row of rows) {
    const k = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((b) => b.key === k);
    if (bucket) bucket.count += 1;
  }

  return buckets.map((b) => ({ date: b.label, count: b.count }));
}

export type PaymentModeKey = "TO_PAY" | "PAID" | "TO_BE_BILLED";

export async function getPaymentModeBreakdown(
  companyId: string,
): Promise<{ mode: PaymentModeKey; count: number; amount: number }[]> {
  const rows = await prisma.lRRequest.groupBy({
    by: ["paymentMode"],
    where: { companyId, status: { not: "rejected" } },
    _count: { _all: true },
    _sum: { freightAmount: true },
  });

  const order: PaymentModeKey[] = ["TO_PAY", "PAID", "TO_BE_BILLED"];
  return order.map((mode) => {
    const found = rows.find((r) => r.paymentMode === mode);
    return {
      mode,
      count: found?._count._all ?? 0,
      amount: found?._sum.freightAmount
        ? Number(found._sum.freightAmount.toString())
        : 0,
    };
  });
}

// ───────────────────── Notifications ─────────────────────

export async function getNotificationsForUser(
  userId: string,
): Promise<Notification[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toNotification);
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  const row = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!row) return null;

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  return toNotification(updated);
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return getNotificationsForUser(userId);
}

export async function computeExecutiveDashboardStats(executiveId: string) {
  const monthStart = startOfMonth();
  const monthEnd = startOfNextMonth();

  const monthLrs = await prisma.lRRequest.findMany({
    where: { executiveId, createdAt: { gte: monthStart, lt: monthEnd } },
    select: { status: true },
  });

  const pending = monthLrs.filter((lr) => lr.status === "pending").length;
  const approved = monthLrs.filter(
    (lr) => lr.status === "approved" || lr.status === "in_transit",
  ).length;
  const rejected = monthLrs.filter((lr) => lr.status === "rejected").length;
  const delivered = monthLrs.filter((lr) => lr.status === "delivered").length;

  return {
    totalLrs: monthLrs.length,
    pending,
    approved,
    rejected,
    delivered,
  };
}

// ───────────────────── Formatting helpers ─────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
