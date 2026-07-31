
-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `logoUrl` VARCHAR(500) NULL,
    `address` TEXT NOT NULL,
    `gstNumber` VARCHAR(32) NOT NULL,
    `stampUrl` VARCHAR(500) NULL,
    `lrCode` VARCHAR(16) NOT NULL,
    `contactPhone` VARCHAR(32) NOT NULL,
    `maxBranches` INTEGER NOT NULL DEFAULT 5,
    `maxExecutives` INTEGER NOT NULL DEFAULT 50,
    `maxLrPerMonth` INTEGER NOT NULL DEFAULT 200,
    `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Company_lrCode_key`(`lrCode`),
    INDEX `Company_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `city` VARCHAR(120) NOT NULL,
    `state` VARCHAR(120) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Branch_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(15) NOT NULL,
    `email` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `role` ENUM('super_admin', 'company_admin', 'executive') NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `branchId` VARCHAR(191) NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive', 'invited') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_mobile_key`(`mobile`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_companyId_role_idx`(`companyId`, `role`),
    INDEX `User_branchId_idx`(`branchId`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LRRequest` (
    `id` VARCHAR(191) NOT NULL,
    `lrNumber` VARCHAR(64) NULL,
    `trackingId` VARCHAR(64) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `executiveId` VARCHAR(191) NOT NULL,
    `consignorName` VARCHAR(255) NOT NULL,
    `consignorAddress` TEXT NOT NULL,
    `consigneeCompany` VARCHAR(255) NULL,
    `consigneeName` VARCHAR(255) NOT NULL,
    `consigneeAddress` TEXT NOT NULL,
    `consigneePhone` VARCHAR(15) NOT NULL,
    `originCity` VARCHAR(120) NOT NULL,
    `destinationCity` VARCHAR(120) NOT NULL,
    `vehicleNumber` VARCHAR(32) NOT NULL,
    `goodsDescription` TEXT NOT NULL,
    `noOfPackages` INTEGER NOT NULL,
    `weightKg` DECIMAL(12, 2) NOT NULL,
    `declaredValue` DECIMAL(14, 2) NOT NULL,
    `freightAmount` DECIMAL(14, 2) NOT NULL,
    `paymentMode` ENUM('To Pay', 'Paid', 'To Be Billed') NOT NULL,
    `dispatchDate` VARCHAR(20) NOT NULL,
    `specialInstructions` TEXT NULL,
    `photos` JSON NOT NULL,
    `signatureUrl` VARCHAR(500) NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'in_transit', 'delivered') NOT NULL DEFAULT 'pending',
    `rejectionReason` TEXT NULL,
    `pdfUrl` VARCHAR(500) NULL,
    `qrCode` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `approvedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,

    UNIQUE INDEX `LRRequest_trackingId_key`(`trackingId`),
    UNIQUE INDEX `LRRequest_qrCode_key`(`qrCode`),
    INDEX `LRRequest_companyId_status_createdAt_idx`(`companyId`, `status`, `createdAt`),
    INDEX `LRRequest_branchId_idx`(`branchId`),
    INDEX `LRRequest_executiveId_createdAt_idx`(`executiveId`, `createdAt`),
    INDEX `LRRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `lrId` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_read_createdAt_idx`(`userId`, `read`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LRSerial` (
    `companyId` VARCHAR(191) NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`companyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Otp` (
    `mobile` VARCHAR(15) NOT NULL,
    `code` VARCHAR(8) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Otp_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`mobile`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: append-only audit trail of admin actions.
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(64) NULL,
    `actorName` VARCHAR(255) NOT NULL,
    `actorRole` ENUM('super_admin', 'company_admin', 'executive') NOT NULL,
    `companyId` VARCHAR(64) NULL,
    `action` VARCHAR(64) NOT NULL,
    `target` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_companyId_createdAt_idx`(`companyId`, `createdAt`),
    INDEX `AuditLog_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LRRequest` ADD CONSTRAINT `LRRequest_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LRRequest` ADD CONSTRAINT `LRRequest_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LRRequest` ADD CONSTRAINT `LRRequest_executiveId_fkey` FOREIGN KEY (`executiveId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_lrId_fkey` FOREIGN KEY (`lrId`) REFERENCES `LRRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LRSerial` ADD CONSTRAINT `LRSerial_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

