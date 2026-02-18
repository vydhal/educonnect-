-- AlterTable
ALTER TABLE "User" ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "schoolType" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
