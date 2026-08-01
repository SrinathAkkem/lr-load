-- AlterTable
ALTER TABLE `Company`
  ADD COLUMN `cin` VARCHAR(32) NULL,
  ADD COLUMN `email` VARCHAR(255) NULL,
  ADD COLUMN `website` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `LRRequest`
  ADD COLUMN `driverName` VARCHAR(255) NULL,
  ADD COLUMN `driverPhone` VARCHAR(15) NULL,
  ADD COLUMN `drivingLicenseNumber` VARCHAR(64) NULL,
  ADD COLUMN `loadingPoint` TEXT NULL,
  ADD COLUMN `unloadingPoint` TEXT NULL,
  ADD COLUMN `invoiceNumber` VARCHAR(64) NULL,
  ADD COLUMN `workOrderNo` VARCHAR(64) NULL,
  ADD COLUMN `insurance` VARCHAR(255) NULL;
