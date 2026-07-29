-- MySQL can store '' for enum values removed before rows were updated (driver → executive).
UPDATE `User` SET `role` = 'executive' WHERE `role` = '' OR `role` = 'driver';

UPDATE `AuditLog` SET `actorRole` = 'executive' WHERE `actorRole` = '' OR `actorRole` = 'driver';
