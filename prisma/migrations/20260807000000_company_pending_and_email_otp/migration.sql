-- AlterTable
ALTER TABLE `Company`
  MODIFY `status` ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'active',
  ADD COLUMN `ibaNumber` VARCHAR(32) NULL,
  ADD COLUMN `rejectionReason` TEXT NULL;

-- CreateTable
CREATE TABLE `EmailOtp` (
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(8) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `EmailOtp_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
