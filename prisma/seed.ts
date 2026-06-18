/* eslint-disable no-console */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("→ resetting tables");
  // Order matters because of FK constraints.
  await prisma.notification.deleteMany();
  await prisma.lRRequest.deleteMany();
  await prisma.lRSerial.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.company.deleteMany();
  await prisma.otp.deleteMany();

  console.log("→ seeding companies");
  await prisma.company.createMany({
    data: [
      {
        id: "comp_vlp",
        name: "Venkateswara Logistics Pvt. Ltd.",
        address:
          "Plot 22, Transport Nagar, Hyderabad — 500018, Telangana",
        gstNumber: "36AABCV1234F1ZK",
        lrCode: "VLP",
        contactPhone: "+91 98765 43210",
        maxBranches: 10,
        maxDrivers: 150,
        maxLrPerMonth: 500,
        status: "active",
        createdAt: new Date("2026-01-14T00:00:00.000Z"),
      },
      {
        id: "comp_abc",
        name: "ABC Transport Co.",
        address: "Plot 8B, Industrial Park, Hyderabad - 500032, Telangana",
        gstNumber: "36AABCA1234M1ZX",
        lrCode: "ABC",
        contactPhone: "+91 98765 43211",
        maxBranches: 5,
        maxDrivers: 50,
        maxLrPerMonth: 200,
        status: "active",
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "comp_ktc",
        name: "KTC Roadlines",
        address: "NH-44, Karimnagar, Telangana",
        gstNumber: "36AABCK5678G1ZP",
        lrCode: "KTC",
        contactPhone: "+91 98765 43212",
        maxBranches: 8,
        maxDrivers: 80,
        maxLrPerMonth: 300,
        status: "active",
        createdAt: new Date("2026-01-20T00:00:00.000Z"),
      },
      {
        id: "comp_suspended",
        name: "Suspended Transport Ltd.",
        address: "Test Address",
        gstNumber: "36AABCS9999S1ZX",
        lrCode: "STL",
        contactPhone: "+91 99999 99999",
        maxBranches: 3,
        maxDrivers: 20,
        maxLrPerMonth: 100,
        status: "suspended",
        createdAt: new Date("2025-12-01T00:00:00.000Z"),
      },
    ],
  });

  console.log("→ seeding LR serial counters");
  await prisma.lRSerial.createMany({
    data: [
      { companyId: "comp_vlp", counter: 478 },
      { companyId: "comp_abc", counter: 250 },
      { companyId: "comp_ktc", counter: 1 },
      { companyId: "comp_suspended", counter: 1 },
    ],
  });

  console.log("→ seeding branches");
  await prisma.branch.createMany({
    data: [
      { id: "br_hyd", companyId: "comp_vlp", name: "Hyderabad — Main Branch", city: "Hyderabad", state: "Telangana" },
      { id: "br_wgl", companyId: "comp_vlp", name: "Warangal Branch", city: "Warangal", state: "Telangana" },
      { id: "br_nel", companyId: "comp_vlp", name: "Nellore Branch", city: "Nellore", state: "Andhra Pradesh" },
      { id: "br_kar", companyId: "comp_vlp", name: "Karimnagar Branch", city: "Karimnagar", state: "Telangana" },
      { id: "br_niz", companyId: "comp_vlp", name: "Nizamabad Branch", city: "Nizamabad", state: "Telangana" },
      { id: "br_abc_hyd", companyId: "comp_abc", name: "Hyderabad Branch", city: "Hyderabad", state: "Telangana" },
    ],
  });

  console.log("→ seeding users");
  const superAdminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.createMany({
    data: [
      {
        id: "user_super",
        mobile: "9000000000",
        email: "admin@ronohub.com",
        password: superAdminPasswordHash,
        role: "super_admin",
        name: "Rayudu Admin",
        status: "active",
      },
      {
        id: "user_admin_vlp",
        mobile: "9876543210",
        role: "company_admin",
        companyId: "comp_vlp",
        name: "Rajesh Kumar",
        status: "active",
      },
      {
        id: "user_admin_abc",
        mobile: "9876543211",
        role: "company_admin",
        companyId: "comp_abc",
        name: "Rajan Sharma",
        status: "active",
      },
      {
        id: "user_driver_ravi",
        mobile: "9012345678",
        role: "driver",
        companyId: "comp_abc",
        branchId: "br_abc_hyd",
        name: "Ravi Kumar",
        status: "active",
      },
      {
        id: "user_driver_suresh",
        mobile: "9988776655",
        role: "driver",
        companyId: "comp_vlp",
        branchId: "br_hyd",
        name: "Suresh Rao",
        status: "active",
      },
      {
        id: "user_driver_mahesh",
        mobile: "9876512345",
        role: "driver",
        companyId: "comp_vlp",
        branchId: "br_wgl",
        name: "Mahesh Kumar",
        status: "active",
      },
    ],
  });

  console.log("→ seeding LR requests");
  const year = new Date().getFullYear();
  const sampleLRs: Prisma.LRRequestCreateManyInput[] = [
    {
      id: "lr_0477",
      lrNumber: null,
      trackingId: `VLP/${year}/0477`,
      companyId: "comp_vlp",
      branchId: "br_hyd",
      driverId: "user_driver_suresh",
      consignorName: "Mehta Traders",
      consignorAddress: "Plot 12, KPHB Colony, Hyderabad — 500072, Telangana",
      consigneeName: "Reddy Wholesale",
      consigneeAddress: "MG Road, Vijayawada — 520010, Andhra Pradesh",
      consigneePhone: "9800144556",
      originCity: "Hyderabad",
      destinationCity: "Vijayawada",
      vehicleNumber: "AP39AB1234",
      goodsDescription: "Textile fabrics and garments",
      noOfPackages: 24,
      weightKg: new Prisma.Decimal(680),
      declaredValue: new Prisma.Decimal(120000),
      freightAmount: new Prisma.Decimal(4200),
      paymentMode: "TO_PAY",
      dispatchDate: "2026-04-07",
      specialInstructions:
        "Handle with care — fragile fabric rolls. Do not stack more than 3 layers.",
      photos: ["/uploads/photo1.jpg", "/uploads/photo2.jpg"],
      signatureUrl: "/uploads/signature.svg",
      status: "pending",
      qrCode: "qr_vlp_0477",
      createdAt: new Date("2026-04-07T05:12:00.000Z"),
    },
    {
      id: "lr_0248",
      lrNumber: null,
      trackingId: `ABC/${year}/0248`,
      companyId: "comp_abc",
      branchId: "br_abc_hyd",
      driverId: "user_driver_ravi",
      consignorName: "Sharma Textiles Pvt Ltd",
      consignorAddress: "Plot 14, Industrial Area, Hyderabad - 500001",
      consigneeName: "Mehta Fabrics & Co.",
      consigneeAddress: "Shop 7, Dharavi Market, Mumbai - 400017",
      consigneePhone: "9876543210",
      originCity: "Hyderabad",
      destinationCity: "Mumbai",
      vehicleNumber: "AP39AB1234",
      goodsDescription: "Cotton fabric rolls, 50 pieces",
      noOfPackages: 50,
      weightKg: new Prisma.Decimal(1200),
      declaredValue: new Prisma.Decimal(450000),
      freightAmount: new Prisma.Decimal(18500),
      paymentMode: "TO_PAY",
      dispatchDate: "2026-04-07",
      specialInstructions: "Handle with care — fragile rolls. Keep dry.",
      photos: [
        "/uploads/photo1.jpg",
        "/uploads/photo2.jpg",
        "/uploads/photo3.jpg",
      ],
      signatureUrl: "/uploads/signature.svg",
      status: "pending",
      qrCode: "qr_abc_0248",
      createdAt: new Date("2026-04-07T02:44:00.000Z"),
    },
    {
      id: "lr_0041",
      lrNumber: `ABC/${year}/0041`,
      trackingId: `ABC/${year}/0041`,
      companyId: "comp_abc",
      branchId: "br_abc_hyd",
      driverId: "user_driver_ravi",
      consignorName: "Srinivas Textiles Pvt Ltd",
      consignorAddress:
        "Plot 14, Industrial Area, Secunderabad, Telangana 500015",
      consigneeName: "Krishna Fabrics",
      consigneeAddress: "Shop 8, MG Road, Chennai 600001",
      consigneePhone: "9876512340",
      originCity: "Hyderabad",
      destinationCity: "Chennai",
      vehicleNumber: "AP39AB1234",
      goodsDescription: "Cotton fabric rolls — 200 bales",
      noOfPackages: 200,
      weightKg: new Prisma.Decimal(1850.5),
      declaredValue: new Prisma.Decimal(420000),
      freightAmount: new Prisma.Decimal(18500),
      paymentMode: "TO_PAY",
      dispatchDate: "2026-04-05",
      photos: ["/uploads/photo1.jpg", "/uploads/photo2.jpg"],
      signatureUrl: "/uploads/signature.svg",
      status: "approved",
      qrCode: "qr_abc_0041",
      pdfUrl: "/api/lr/lr_0041/pdf",
      approvedAt: new Date("2026-04-05T10:00:00.000Z"),
      createdAt: new Date("2026-04-05T08:00:00.000Z"),
    },
    {
      id: "lr_0042",
      lrNumber: null,
      trackingId: `ABC/${year}/0042`,
      companyId: "comp_abc",
      branchId: "br_abc_hyd",
      driverId: "user_driver_ravi",
      consignorName: "Test Consignor",
      consignorAddress: "Test Address",
      consigneeName: "Test Consignee",
      consigneeAddress: "Test Address 2",
      consigneePhone: "9876543211",
      originCity: "Hyderabad",
      destinationCity: "Mumbai",
      vehicleNumber: "AP39AB9999",
      goodsDescription: "Test goods",
      noOfPackages: 10,
      weightKg: new Prisma.Decimal(100),
      declaredValue: new Prisma.Decimal(10000),
      freightAmount: new Prisma.Decimal(5000),
      paymentMode: "PAID",
      dispatchDate: "2026-04-06",
      photos: [],
      signatureUrl: "/uploads/signature.svg",
      status: "rejected",
      rejectionReason:
        "Vehicle number format is incorrect. Please re-enter as AP39AB1234 (uppercase, no spaces).",
      qrCode: "qr_abc_0042",
      createdAt: new Date("2026-04-06T08:00:00.000Z"),
    },
    {
      id: "lr_0040",
      lrNumber: `ABC/${year}/0040`,
      trackingId: `ABC/${year}/0040`,
      companyId: "comp_abc",
      branchId: "br_abc_hyd",
      driverId: "user_driver_ravi",
      consignorName: "Delivered Consignor",
      consignorAddress: "Address 1",
      consigneeName: "Delivered Consignee",
      consigneeAddress: "Address 2",
      consigneePhone: "9876543212",
      originCity: "Hyderabad",
      destinationCity: "Vijayawada",
      vehicleNumber: "AP39AB1234",
      goodsDescription: "Delivered goods",
      noOfPackages: 5,
      weightKg: new Prisma.Decimal(50),
      declaredValue: new Prisma.Decimal(5000),
      freightAmount: new Prisma.Decimal(2000),
      paymentMode: "PAID",
      dispatchDate: "2026-04-01",
      photos: [],
      signatureUrl: "/uploads/signature.svg",
      status: "delivered",
      qrCode: "qr_abc_0040",
      pdfUrl: "/api/lr/lr_0040/pdf",
      approvedAt: new Date("2026-04-01T12:00:00.000Z"),
      deliveredAt: new Date("2026-04-03T12:00:00.000Z"),
      createdAt: new Date("2026-04-01T08:00:00.000Z"),
    },
    {
      id: "lr_00142",
      lrNumber: `VLP/${year}/00142`,
      trackingId: `VLP/${year}/00142`,
      companyId: "comp_vlp",
      branchId: "br_hyd",
      driverId: "user_driver_suresh",
      consignorName: "Sri Sai Traders",
      consignorAddress: "Plot 24, ECIL Cross Road, Hyderabad — 500062",
      consigneeName: "Mahesh Enterprises",
      consigneeAddress: "Shop 8, Dharavi Industrial Area, Mumbai — 400017",
      consigneePhone: "9800144556",
      originCity: "Hyderabad",
      destinationCity: "Mumbai",
      vehicleNumber: "TS09EA4422",
      goodsDescription: "Steel Pipes (Industrial Grade)",
      noOfPackages: 12,
      weightKg: new Prisma.Decimal(860),
      declaredValue: new Prisma.Decimal(250000),
      freightAmount: new Prisma.Decimal(8500),
      paymentMode: "TO_PAY",
      dispatchDate: "2026-04-14",
      photos: [],
      signatureUrl: "/uploads/signature.svg",
      status: "approved",
      qrCode: "qr_vlp_00142",
      pdfUrl: "/api/lr/lr_00142/pdf",
      approvedAt: new Date("2026-04-14T04:00:00.000Z"),
      createdAt: new Date("2026-04-14T04:00:00.000Z"),
    },
  ];

  await prisma.lRRequest.createMany({ data: sampleLRs });
  console.log("✓ seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
