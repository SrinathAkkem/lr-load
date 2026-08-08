export type UserRole = "super_admin" | "company_admin" | "executive";
export type UserStatus = "active" | "inactive" | "invited";
export type CompanyStatus = "pending" | "active" | "suspended";
export type LRStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "in_transit"
  | "delivered";
export type PaymentMode = "To Pay" | "Paid" | "To Be Billed";

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  gstNumber: string;
  cin?: string;
  email?: string;
  website?: string;
  stampUrl?: string;
  lrCode: string;
  contactPhone: string;
  ibaNumber?: string;
  rejectionReason?: string;
  maxBranches: number;
  maxExecutives: number;
  maxLrPerMonth: number;
  status: CompanyStatus;
  createdAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  city: string;
  state: string;
  createdAt: string;
}

export interface User {
  id: string;
  mobile: string;
  role: UserRole;
  companyId: string | null;
  branchId: string | null;
  name: string;
  status: UserStatus;
  createdAt: string;
  email?: string;
  password?: string;
}

export interface LRRequest {
  id: string;
  lrNumber: string | null;
  trackingId: string;
  companyId: string;
  branchId: string;
  executiveId: string;
  consignorName: string;
  consignorAddress: string;
  consigneeCompany: string | null;
  consigneeName: string;
  consigneeAddress: string;
  consigneePhone: string;
  originCity: string;
  destinationCity: string;
  vehicleNumber: string;
  driverName?: string;
  driverPhone?: string;
  drivingLicenseNumber?: string;
  loadingPoint?: string;
  unloadingPoint?: string;
  goodsDescription: string;
  noOfPackages: number;
  weightKg: number;
  declaredValue: number;
  freightAmount: number;
  paymentMode: PaymentMode;
  invoiceNumber?: string;
  workOrderNo?: string;
  insurance?: string;
  dispatchDate: string;
  specialInstructions?: string;
  photos: string[];
  signatureUrl?: string;
  status: LRStatus;
  rejectionReason?: string;
  pdfUrl?: string;
  qrCode: string;
  createdAt: string;
  approvedAt?: string;
  deliveredAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  lrId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  companyId: string | null;
  branchId: string | null;
  name: string;
  token: string;
}

export interface DashboardStats {
  totalLrs: number;
  pending: number;
  approved: number;
  rejected: number;
  delivered: number;
  inTransit: number;
  freightTotal: number;
  approvalRate: number;
}
