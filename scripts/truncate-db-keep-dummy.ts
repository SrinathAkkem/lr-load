/* eslint-disable no-console */
/**
 * Truncate all table data except the dummy account ecosystem for 9876543210.
 * Does NOT drop tables or the database — only deletes rows.
 *
 * Keeps:
 * - User with mobile 9876543210 and all users in the same company
 * - That company's branches, LRs, LR serial, notifications, saved addresses
 * - OTP row for 9876543210 (if present)
 *
 * Clears:
 * - All other companies/users/LRs and standalone marketing/audit data
 */
import { PrismaClient } from "@prisma/client";

const KEEP_MOBILE = "9876543210";

const prisma = new PrismaClient();

async function main() {
  const keepUser = await prisma.user.findUnique({ where: { mobile: KEEP_MOBILE } });
  if (!keepUser) {
    throw new Error(
      `No user with mobile ${KEEP_MOBILE}. Run "npm run db:seed" first to create the dummy account.`,
    );
  }

  const keepCompanyId = keepUser.companyId;
  const keepUserIds = keepCompanyId
    ? (
        await prisma.user.findMany({
          where: { companyId: keepCompanyId },
          select: { id: true },
        })
      ).map((u) => u.id)
    : [keepUser.id];

  console.log(`→ Keeping user ${keepUser.name} (${KEEP_MOBILE})`);
  if (keepCompanyId) {
    console.log(`→ Keeping company ${keepCompanyId} with ${keepUserIds.length} user(s)`);
  }

  // Standalone / marketing tables — full clear
  const contactDeleted = await prisma.contactEnquiry.deleteMany();
  const auditDeleted = await prisma.auditLog.deleteMany();
  const emailOtpDeleted = await prisma.emailOtp.deleteMany();
  const uploadDeleted = await prisma.upload.deleteMany();

  // OTP — keep dummy mobile only
  const otpDeleted = await prisma.otp.deleteMany({
    where: { mobile: { not: KEEP_MOBILE } },
  });

  if (keepCompanyId) {
    // Notifications tied to LRs outside kept company
    const notifByLr = await prisma.notification.deleteMany({
      where: {
        lrId: { not: null },
        lr: { companyId: { not: keepCompanyId } },
      },
    });

    const notifByUser = await prisma.notification.deleteMany({
      where: { userId: { notIn: keepUserIds } },
    });

    const lrsDeleted = await prisma.lRRequest.deleteMany({
      where: { companyId: { not: keepCompanyId } },
    });

    const addressesDeleted = await prisma.savedAddress.deleteMany({
      where: { userId: { notIn: keepUserIds } },
    });

    const usersDeleted = await prisma.user.deleteMany({
      where: { id: { notIn: keepUserIds } },
    });

    const serialDeleted = await prisma.lRSerial.deleteMany({
      where: { companyId: { not: keepCompanyId } },
    });

    const branchesDeleted = await prisma.branch.deleteMany({
      where: { companyId: { not: keepCompanyId } },
    });

    const companiesDeleted = await prisma.company.deleteMany({
      where: { id: { not: keepCompanyId } },
    });

    console.log("→ Deleted rows:");
    console.log(`   ContactEnquiry: ${contactDeleted.count}`);
    console.log(`   AuditLog: ${auditDeleted.count}`);
    console.log(`   EmailOtp: ${emailOtpDeleted.count}`);
    console.log(`   Upload: ${uploadDeleted.count}`);
    console.log(`   Otp (non-dummy): ${otpDeleted.count}`);
    console.log(`   Notification (by LR): ${notifByLr.count}`);
    console.log(`   Notification (by user): ${notifByUser.count}`);
    console.log(`   LRRequest: ${lrsDeleted.count}`);
    console.log(`   SavedAddress: ${addressesDeleted.count}`);
    console.log(`   User: ${usersDeleted.count}`);
    console.log(`   LRSerial: ${serialDeleted.count}`);
    console.log(`   Branch: ${branchesDeleted.count}`);
    console.log(`   Company: ${companiesDeleted.count}`);
  } else {
    // Dummy user has no company — remove all operational data
    const notifDeleted = await prisma.notification.deleteMany();
    const lrsDeleted = await prisma.lRRequest.deleteMany();
    const addressesDeleted = await prisma.savedAddress.deleteMany();
    const usersDeleted = await prisma.user.deleteMany({
      where: { id: { not: keepUser.id } },
    });
    const serialDeleted = await prisma.lRSerial.deleteMany();
    const branchesDeleted = await prisma.branch.deleteMany();
    const companiesDeleted = await prisma.company.deleteMany();

    console.log("→ Deleted rows (dummy user has no company):");
    console.log(`   ContactEnquiry: ${contactDeleted.count}`);
    console.log(`   AuditLog: ${auditDeleted.count}`);
    console.log(`   EmailOtp: ${emailOtpDeleted.count}`);
    console.log(`   Upload: ${uploadDeleted.count}`);
    console.log(`   Otp (non-dummy): ${otpDeleted.count}`);
    console.log(`   Notification: ${notifDeleted.count}`);
    console.log(`   LRRequest: ${lrsDeleted.count}`);
    console.log(`   SavedAddress: ${addressesDeleted.count}`);
    console.log(`   User: ${usersDeleted.count}`);
    console.log(`   LRSerial: ${serialDeleted.count}`);
    console.log(`   Branch: ${branchesDeleted.count}`);
    console.log(`   Company: ${companiesDeleted.count}`);
  }

  const remaining = {
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    branches: await prisma.branch.count(),
    lrs: await prisma.lRRequest.count(),
  };

  console.log("\n✓ Truncate complete. Remaining rows:");
  console.log(`   Users: ${remaining.users}`);
  console.log(`   Companies: ${remaining.companies}`);
  console.log(`   Branches: ${remaining.branches}`);
  console.log(`   LRs: ${remaining.lrs}`);
  console.log(`\nDummy login: ${KEEP_MOBILE} (OTP 123456 in dev)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
