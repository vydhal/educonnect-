-- CreateTable
CREATE TABLE "_UserSchoolAssociation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserSchoolAssociation_AB_unique" ON "_UserSchoolAssociation"("A", "B");

-- CreateIndex
CREATE INDEX "_UserSchoolAssociation_B_index" ON "_UserSchoolAssociation"("B");

-- AddForeignKey
ALTER TABLE "_UserSchoolAssociation" ADD CONSTRAINT "_UserSchoolAssociation_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserSchoolAssociation" ADD CONSTRAINT "_UserSchoolAssociation_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
