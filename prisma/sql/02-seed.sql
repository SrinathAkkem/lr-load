-- ────────────────────────────────────────────────────────────────────────────
--  Rono LR — demo seed data
--  Run this AFTER 01-schema.sql in phpMyAdmin → SQL tab.
--  Safe to skip in production. Re-running it will fail on duplicate keys —
--  truncate first if you want a clean re-seed.
-- ────────────────────────────────────────────────────────────────────────────

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `Notification`;
TRUNCATE TABLE `LRRequest`;
TRUNCATE TABLE `LRSerial`;
TRUNCATE TABLE `User`;
TRUNCATE TABLE `Branch`;
TRUNCATE TABLE `Company`;
TRUNCATE TABLE `Otp`;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── Companies ───────────────────────────────────────────────────────────────
INSERT INTO `Company`
  (`id`, `name`, `address`, `gstNumber`, `lrCode`, `contactPhone`,
   `maxBranches`, `maxExecutives`, `maxLrPerMonth`, `status`, `createdAt`, `updatedAt`)
VALUES
  ('comp_vlp', 'Venkateswara Logistics Pvt. Ltd.',
   'Plot 22, Transport Nagar, Hyderabad — 500018, Telangana',
   '36AABCV1234F1ZK', 'VLP', '+91 98765 43210',
   10, 150, 500, 'active', '2026-01-14 00:00:00', NOW(3)),
  ('comp_abc', 'ABC Transport Co.',
   'Plot 8B, Industrial Park, Hyderabad - 500032, Telangana',
   '36AABCA1234M1ZX', 'ABC', '+91 98765 43211',
   5, 50, 200, 'active', '2026-02-01 00:00:00', NOW(3)),
  ('comp_ktc', 'KTC Roadlines',
   'NH-44, Karimnagar, Telangana',
   '36AABCK5678G1ZP', 'KTC', '+91 98765 43212',
   8, 80, 300, 'active', '2026-01-20 00:00:00', NOW(3)),
  ('comp_suspended', 'Suspended Transport Ltd.',
   'Test Address',
   '36AABCS9999S1ZX', 'STL', '+91 99999 99999',
   3, 20, 100, 'suspended', '2025-12-01 00:00:00', NOW(3));

-- ─── LR serial counters ──────────────────────────────────────────────────────
INSERT INTO `LRSerial` (`companyId`, `counter`) VALUES
  ('comp_vlp', 478),
  ('comp_abc', 250),
  ('comp_ktc', 1),
  ('comp_suspended', 1);

-- ─── Branches ────────────────────────────────────────────────────────────────
INSERT INTO `Branch` (`id`, `companyId`, `name`, `city`, `state`, `createdAt`) VALUES
  ('br_hyd', 'comp_vlp', 'Hyderabad — Main Branch', 'Hyderabad', 'Telangana', NOW(3)),
  ('br_wgl', 'comp_vlp', 'Warangal Branch', 'Warangal', 'Telangana', NOW(3)),
  ('br_nel', 'comp_vlp', 'Nellore Branch', 'Nellore', 'Andhra Pradesh', NOW(3)),
  ('br_kar', 'comp_vlp', 'Karimnagar Branch', 'Karimnagar', 'Telangana', NOW(3)),
  ('br_niz', 'comp_vlp', 'Nizamabad Branch', 'Nizamabad', 'Telangana', NOW(3)),
  ('br_abc_hyd', 'comp_abc', 'Hyderabad Branch', 'Hyderabad', 'Telangana', NOW(3));

-- ─── Users ───────────────────────────────────────────────────────────────────
-- Super admin password is `admin123`, stored as a bcrypt hash. Login at
-- /super-admin/login with admin@ronohub.com / admin123, then immediately
-- change the password on first login (planned UI).
INSERT INTO `User`
  (`id`, `mobile`, `email`, `password`, `role`, `companyId`, `branchId`,
   `name`, `status`, `createdAt`, `updatedAt`)
VALUES
  ('user_super', '9000000000', 'admin@ronohub.com',
   '$2b$10$u9Y9rk.BfaRzDlu85OVxnOelQrpuPjrwgrwN.lzugFweQ2AyvqUQG',
   'super_admin', NULL, NULL, 'Rayudu Admin', 'active', NOW(3), NOW(3)),
  ('user_admin_vlp', '9876543210', NULL, NULL, 'company_admin',
   'comp_vlp', NULL, 'Rajesh Kumar', 'active', NOW(3), NOW(3)),
  ('user_admin_abc', '9876543211', NULL, NULL, 'company_admin',
   'comp_abc', NULL, 'Rajan Sharma', 'active', NOW(3), NOW(3)),
  ('user_exec_ravi', '9012345678', NULL, NULL, 'executive',
   'comp_abc', 'br_abc_hyd', 'Ravi Kumar', 'active', NOW(3), NOW(3)),
  ('user_exec_suresh', '9988776655', NULL, NULL, 'executive',
   'comp_vlp', 'br_hyd', 'Suresh Rao', 'active', NOW(3), NOW(3)),
  ('user_exec_mahesh', '9876512345', NULL, NULL, 'executive',
   'comp_vlp', 'br_wgl', 'Mahesh Kumar', 'active', NOW(3), NOW(3));

-- ─── Sample LR requests ──────────────────────────────────────────────────────
INSERT INTO `LRRequest`
  (`id`, `lrNumber`, `trackingId`, `companyId`, `branchId`, `executiveId`,
   `consignorName`, `consignorAddress`, `consigneeName`, `consigneeAddress`, `consigneePhone`,
   `originCity`, `destinationCity`, `vehicleNumber`,
   `goodsDescription`, `noOfPackages`, `weightKg`, `declaredValue`, `freightAmount`,
   `paymentMode`, `dispatchDate`, `specialInstructions`,
   `photos`, `signatureUrl`, `status`, `qrCode`, `pdfUrl`,
   `createdAt`, `updatedAt`, `approvedAt`, `deliveredAt`, `rejectionReason`)
VALUES
  ('lr_0477', NULL, 'VLP/2026/0477', 'comp_vlp', 'br_hyd', 'user_exec_suresh',
   'Mehta Traders', 'Plot 12, KPHB Colony, Hyderabad — 500072, Telangana',
   'Reddy Wholesale', 'MG Road, Vijayawada — 520010, Andhra Pradesh', '9800144556',
   'Hyderabad', 'Vijayawada', 'AP39AB1234',
   'Textile fabrics and garments', 24, 680.00, 120000.00, 4200.00,
   'To Pay', '2026-04-07',
   'Handle with care — fragile fabric rolls. Do not stack more than 3 layers.',
   '["/uploads/photo1.jpg","/uploads/photo2.jpg"]', '/uploads/signature.svg',
   'pending', 'qr_vlp_0477', NULL,
   '2026-04-07 05:12:00', NOW(3), NULL, NULL, NULL),

  ('lr_0248', NULL, 'ABC/2026/0248', 'comp_abc', 'br_abc_hyd', 'user_exec_ravi',
   'Sharma Textiles Pvt Ltd', 'Plot 14, Industrial Area, Hyderabad - 500001',
   'Mehta Fabrics & Co.', 'Shop 7, Dharavi Market, Mumbai - 400017', '9876543210',
   'Hyderabad', 'Mumbai', 'AP39AB1234',
   'Cotton fabric rolls, 50 pieces', 50, 1200.00, 450000.00, 18500.00,
   'To Pay', '2026-04-07',
   'Handle with care — fragile rolls. Keep dry.',
   '["/uploads/photo1.jpg","/uploads/photo2.jpg","/uploads/photo3.jpg"]',
   '/uploads/signature.svg', 'pending', 'qr_abc_0248', NULL,
   '2026-04-07 02:44:00', NOW(3), NULL, NULL, NULL),

  ('lr_0041', 'ABC/2026/0041', 'ABC/2026/0041', 'comp_abc', 'br_abc_hyd', 'user_exec_ravi',
   'Srinivas Textiles Pvt Ltd', 'Plot 14, Industrial Area, Secunderabad, Telangana 500015',
   'Krishna Fabrics', 'Shop 8, MG Road, Chennai 600001', '9876512340',
   'Hyderabad', 'Chennai', 'AP39AB1234',
   'Cotton fabric rolls — 200 bales', 200, 1850.50, 420000.00, 18500.00,
   'To Pay', '2026-04-05', NULL,
   '["/uploads/photo1.jpg","/uploads/photo2.jpg"]', '/uploads/signature.svg',
   'approved', 'qr_abc_0041', '/api/lr/lr_0041/pdf',
   '2026-04-05 08:00:00', NOW(3), '2026-04-05 10:00:00', NULL, NULL),

  ('lr_0042', NULL, 'ABC/2026/0042', 'comp_abc', 'br_abc_hyd', 'user_exec_ravi',
   'Test Consignor', 'Test Address',
   'Test Consignee', 'Test Address 2', '9876543211',
   'Hyderabad', 'Mumbai', 'AP39AB9999',
   'Test goods', 10, 100.00, 10000.00, 5000.00,
   'Paid', '2026-04-06', NULL,
   '[]', '/uploads/signature.svg',
   'rejected', 'qr_abc_0042', NULL,
   '2026-04-06 08:00:00', NOW(3), NULL, NULL,
   'Vehicle number format is incorrect. Please re-enter as AP39AB1234 (uppercase, no spaces).'),

  ('lr_0040', 'ABC/2026/0040', 'ABC/2026/0040', 'comp_abc', 'br_abc_hyd', 'user_exec_ravi',
   'Delivered Consignor', 'Address 1',
   'Delivered Consignee', 'Address 2', '9876543212',
   'Hyderabad', 'Vijayawada', 'AP39AB1234',
   'Delivered goods', 5, 50.00, 5000.00, 2000.00,
   'Paid', '2026-04-01', NULL,
   '[]', '/uploads/signature.svg',
   'delivered', 'qr_abc_0040', '/api/lr/lr_0040/pdf',
   '2026-04-01 08:00:00', NOW(3), '2026-04-01 12:00:00', '2026-04-03 12:00:00', NULL),

  ('lr_00142', 'VLP/2026/00142', 'VLP/2026/00142', 'comp_vlp', 'br_hyd', 'user_exec_suresh',
   'Sri Sai Traders', 'Plot 24, ECIL Cross Road, Hyderabad — 500062',
   'Mahesh Enterprises', 'Shop 8, Dharavi Industrial Area, Mumbai — 400017', '9800144556',
   'Hyderabad', 'Mumbai', 'TS09EA4422',
   'Steel Pipes (Industrial Grade)', 12, 860.00, 250000.00, 8500.00,
   'To Pay', '2026-04-14', NULL,
   '[]', '/uploads/signature.svg',
   'approved', 'qr_vlp_00142', '/api/lr/lr_00142/pdf',
   '2026-04-14 04:00:00', NOW(3), '2026-04-14 04:00:00', NULL, NULL);
