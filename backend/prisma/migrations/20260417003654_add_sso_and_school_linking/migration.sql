-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "schoolId" TEXT;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
