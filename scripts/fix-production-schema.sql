-- Repair production DB when migrations were marked applied but SQL never ran.

ALTER TABLE `Company`
  MODIFY `status` ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'active';

ALTER TABLE `Company` ADD COLUMN `ibaNumber` VARCHAR(32) NULL;
ALTER TABLE `Company` ADD COLUMN `rejectionReason` TEXT NULL;

CREATE TABLE `EmailOtp` (
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(8) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `EmailOtp_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContactEnquiry` (
  `id` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(255) NOT NULL,
  `customerId` VARCHAR(64) NULL,
  `email` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(32) NOT NULL,
  `subject` VARCHAR(120) NOT NULL,
  `message` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ContactEnquiry_createdAt_idx`(`createdAt`),
  INDEX `ContactEnquiry_email_idx`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
