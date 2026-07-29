import type { Prisma } from "@prisma/client";
import type {
  Branch,
  Company,
  LRRequest,
  Notification,
  PaymentMode,
  User,
} from "@/lib/types";

// Prisma stores PaymentMode as `TO_PAY | PAID | TO_BE_BILLED` but the public API
// and the validations expose the human form. These helpers convert in both
// directions so the rest of the codebase can stay agnostic to the storage form.
export function paymentModeToApi(
  v: "TO_PAY" | "PAID" | "TO_BE_BILLED",
): PaymentMode {
  switch (v) {
    case "TO_PAY":
      return "To Pay";
    case "PAID":
      return "Paid";
    case "TO_BE_BILLED":
      return "To Be Billed";
  }
}

export function paymentModeToDb(
  v: PaymentMode,
): "TO_PAY" | "PAID" | "TO_BE_BILLED" {
  switch (v) {
    case "To Pay":
      return "TO_PAY";
    case "Paid":
      return "PAID";
    case "To Be Billed":
      return "TO_BE_BILLED";
  }
}

const decimalToNumber = (d: Prisma.Decimal | number | null | undefined): number =>
  d == null ? 0 : typeof d === "number" ? d : Number(d.toString());

const dateToIso = (d: Date | null | undefined): string | undefined =>
  d ? d.toISOString() : undefined;

type PrismaCompany = {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string;
  gstNumber: string;
  stampUrl: string | null;
  lrCode: string;
  contactPhone: string;
  maxBranches: number;
  maxExecutives: number;
  maxLrPerMonth: number;
  status: "active" | "suspended";
  createdAt: Date;
};

type PrismaBranch = {
  id: string;
  companyId: string;
  name: string;
  city: string;
  state: string;
  createdAt: Date;
};

type PrismaUser = {
  id: string;
  mobile: string;
  email: string | null;
  password?: string | null;
  role: "super_admin" | "company_admin" | "executive";
  companyId: string | null;
  branchId: string | null;
  name: string;
  status: "active" | "inactive" | "invited";
  createdAt: Date;
};

type PrismaLR = {
  id: string;
  lrNumber: string | null;
  trackingId: string;
  companyId: string;
  branchId: string;
  executiveId: string;
  consignorName: string;
  consignorAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneePhone: string;
  originCity: string;
  destinationCity: string;
  vehicleNumber: string;
  goodsDescription: string;
  noOfPackages: number;
  weightKg: Prisma.Decimal;
  declaredValue: Prisma.Decimal;
  freightAmount: Prisma.Decimal;
  paymentMode: "TO_PAY" | "PAID" | "TO_BE_BILLED";
  dispatchDate: string;
  specialInstructions: string | null;
  photos: Prisma.JsonValue;
  signatureUrl: string | null;
  status: "pending" | "approved" | "rejected" | "in_transit" | "delivered";
  rejectionReason: string | null;
  pdfUrl: string | null;
  qrCode: string;
  createdAt: Date;
  approvedAt: Date | null;
  deliveredAt: Date | null;
};

type PrismaNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  lrId: string | null;
  read: boolean;
  createdAt: Date;
};

export function toCompany(c: PrismaCompany): Company {
  return {
    id: c.id,
    name: c.name,
    logoUrl: c.logoUrl ?? undefined,
    address: c.address,
    gstNumber: c.gstNumber,
    stampUrl: c.stampUrl ?? undefined,
    lrCode: c.lrCode,
    contactPhone: c.contactPhone,
    maxBranches: c.maxBranches,
    maxExecutives: c.maxExecutives,
    maxLrPerMonth: c.maxLrPerMonth,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

export function toBranch(b: PrismaBranch): Branch {
  return {
    id: b.id,
    companyId: b.companyId,
    name: b.name,
    city: b.city,
    state: b.state,
    createdAt: b.createdAt.toISOString(),
  };
}

export function toUser(u: PrismaUser): User {
  return {
    id: u.id,
    mobile: u.mobile,
    email: u.email ?? undefined,
    role: u.role,
    companyId: u.companyId,
    branchId: u.branchId,
    name: u.name,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toLR(lr: PrismaLR): LRRequest {
  const photos = Array.isArray(lr.photos)
    ? (lr.photos as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  return {
    id: lr.id,
    lrNumber: lr.lrNumber,
    trackingId: lr.trackingId,
    companyId: lr.companyId,
    branchId: lr.branchId,
    executiveId: lr.executiveId,
    consignorName: lr.consignorName,
    consignorAddress: lr.consignorAddress,
    consigneeName: lr.consigneeName,
    consigneeAddress: lr.consigneeAddress,
    consigneePhone: lr.consigneePhone,
    originCity: lr.originCity,
    destinationCity: lr.destinationCity,
    vehicleNumber: lr.vehicleNumber,
    goodsDescription: lr.goodsDescription,
    noOfPackages: lr.noOfPackages,
    weightKg: decimalToNumber(lr.weightKg),
    declaredValue: decimalToNumber(lr.declaredValue),
    freightAmount: decimalToNumber(lr.freightAmount),
    paymentMode: paymentModeToApi(lr.paymentMode),
    dispatchDate: lr.dispatchDate,
    specialInstructions: lr.specialInstructions ?? undefined,
    photos,
    signatureUrl: lr.signatureUrl ?? undefined,
    status: lr.status,
    rejectionReason: lr.rejectionReason ?? undefined,
    pdfUrl: lr.pdfUrl ?? undefined,
    qrCode: lr.qrCode,
    createdAt: lr.createdAt.toISOString(),
    approvedAt: dateToIso(lr.approvedAt),
    deliveredAt: dateToIso(lr.deliveredAt),
  };
}

export function toNotification(n: PrismaNotification): Notification {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    lrId: n.lrId ?? undefined,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

type PrismaSavedAddress = {
  id: string;
  userId: string;
  type: string;
  name: string;
  company: string | null;
  address: string;
  pincode: string | null;
  phone: string;
  createdAt: Date;
};

export type SavedAddressDto = {
  id: string;
  type: "consigner" | "consignee";
  name: string;
  company?: string;
  address: string;
  pincode?: string;
  phone: string;
  userId: string;
  createdAt: string;
};

export function toSavedAddress(row: PrismaSavedAddress): SavedAddressDto {
  return {
    id: row.id,
    type: row.type as "consigner" | "consignee",
    name: row.name,
    company: row.company ?? undefined,
    address: row.address,
    pincode: row.pincode ?? undefined,
    phone: row.phone,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
  };
}
