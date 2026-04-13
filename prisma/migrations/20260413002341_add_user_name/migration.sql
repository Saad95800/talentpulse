-- DropIndex
DROP INDEX `MatchRecord_userId_fkey` ON `matchrecord`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `name` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `MatchRecord` ADD CONSTRAINT `MatchRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
