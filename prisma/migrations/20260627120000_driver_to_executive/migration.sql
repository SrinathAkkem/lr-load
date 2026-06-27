-- Migrate driver role and columns to executive naming.

UPDATE `User` SET `role` = 'executive' WHERE `role` = 'driver';

ALTER TABLE `Company` CHANGE COLUMN `maxDrivers` `maxExecutives` INTEGER NOT NULL DEFAULT 50;

ALTER TABLE `LRRequest` CHANGE COLUMN `driverId` `executiveId` VARCHAR(191) NOT NULL;

DROP INDEX `LRRequest_driverId_createdAt_idx` ON `LRRequest`;
CREATE INDEX `LRRequest_executiveId_createdAt_idx` ON `LRRequest`(`executiveId`, `createdAt`);

ALTER TABLE `User` MODIFY `role` ENUM('super_admin', 'company_admin', 'executive') NOT NULL;
