-- CreateTable
CREATE TABLE "StaffAvailability" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffAvailability_staffId_dayOfWeek_idx" ON "StaffAvailability"("staffId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "StaffAvailability" ADD CONSTRAINT "StaffAvailability_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
