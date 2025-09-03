/*
  Warnings:

  - Added the required column `orgUnitId` to the `sites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "org_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "parentId" TEXT,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "org_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "org_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_org_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_org_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_org_assignments_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beforeData" TEXT,
    "afterData" TEXT,
    "metadata" TEXT,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "progress" REAL NOT NULL DEFAULT 0.0,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" DATETIME,
    "expectedEndDate" DATETIME,
    "actualEndDate" DATETIME,
    "location" TEXT,
    "manpower" INTEGER NOT NULL DEFAULT 1,
    "executorId" TEXT,
    "supervisorId" TEXT,
    "budgetAmount" REAL,
    "costToDate" REAL NOT NULL DEFAULT 0.0,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "currentApprover" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "tasks_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tasks_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_updates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progressDelta" REAL NOT NULL,
    "progressAfter" REAL NOT NULL,
    "note" TEXT NOT NULL,
    "manpower" INTEGER,
    "location" TEXT,
    "executedById" TEXT,
    "enteredById" TEXT NOT NULL,
    "statusChange" TEXT,
    "issues" TEXT,
    CONSTRAINT "task_updates_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_approvals_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentApprover" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "approvalTrail" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "expenses_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "expenses_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revenues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0.0,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "date" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "revenues_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "revenues_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "revenues_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "siteId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "paid" REAL NOT NULL,
    "remaining" REAL NOT NULL,
    "dueDate" DATETIME,
    "kind" TEXT NOT NULL DEFAULT 'MANUAL',
    "pdfUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receipts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "receipts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "nationalId" TEXT,
    "dateOfBirth" DATETIME,
    "address" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "hireDate" DATETIME NOT NULL,
    "terminationDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "salaryType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "salaryAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LYD',
    "overtimeRate" REAL NOT NULL DEFAULT 1.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "employees_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "safes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT,
    "orgUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "safes_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "safes_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "safe_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "safeId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT,
    "counterpartySafeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentApprover" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "safe_transactions_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "safes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "safe_transactions_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT,
    "orgUnitId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "baseTotal" REAL NOT NULL DEFAULT 0.0,
    "overtimeTotal" REAL NOT NULL DEFAULT 0.0,
    "bonusTotal" REAL NOT NULL DEFAULT 0.0,
    "deductionTotal" REAL NOT NULL DEFAULT 0.0,
    "netTotal" REAL NOT NULL DEFAULT 0.0,
    "currentApprover" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "approvalNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payroll_runs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payroll_runs_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "payrollRunId" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "payDate" DATETIME,
    "workingDays" INTEGER NOT NULL,
    "actualDaysWorked" INTEGER NOT NULL,
    "overtimeHours" REAL NOT NULL DEFAULT 0.0,
    "basicSalary" REAL NOT NULL,
    "overtimePay" REAL NOT NULL DEFAULT 0.0,
    "allowances" TEXT,
    "totalEarnings" REAL NOT NULL,
    "deductions" TEXT,
    "totalDeductions" REAL NOT NULL DEFAULT 0.0,
    "netSalary" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "paidBy" TEXT,
    "paidAt" DATETIME,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payslips_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "location" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "progress" REAL NOT NULL DEFAULT 0.0,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "budget" REAL,
    "spent" REAL NOT NULL DEFAULT 0.0,
    "startDate" DATETIME,
    "targetDate" DATETIME,
    "managerId" TEXT,
    "region" TEXT,
    "orgUnitId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sites_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- First, create default organizational hierarchy
-- PMO (root)
INSERT INTO "org_units" (id, type, name, code, region, isActive, createdAt, updatedAt)
VALUES ('pmo-root', 'PMO', 'PMO Head Office', 'PMO', 'National', true, datetime('now'), datetime('now'));

-- West Area
INSERT INTO "org_units" (id, type, name, code, parentId, region, isActive, createdAt, updatedAt)
VALUES ('area-west', 'AREA', 'West Region', 'WEST', 'pmo-root', 'West Region', true, datetime('now'), datetime('now'));

-- Default Project under West Area  
INSERT INTO "org_units" (id, type, name, code, parentId, region, isActive, createdAt, updatedAt)
VALUES ('project-default', 'PROJECT', 'Default Project', 'PROJ-001', 'area-west', 'West Region', true, datetime('now'), datetime('now'));

-- Default Zone under Project
INSERT INTO "org_units" (id, type, name, code, parentId, region, isActive, createdAt, updatedAt)
VALUES ('zone-default', 'ZONE', 'Zone A', 'ZONE-A', 'project-default', 'West Region', true, datetime('now'), datetime('now'));

-- Migrate existing sites to the default zone
INSERT INTO "new_sites" ("id", "name", "code", "location", "description", "status", "progress", "priority", "budget", "spent", "startDate", "targetDate", "managerId", "region", "orgUnitId", "isActive", "createdAt", "updatedAt")
SELECT "id", "name", NULL, "location", "description", 'PLANNING', 0.0, 'MEDIUM', NULL, 0.0, NULL, NULL, NULL, 'West Region', 'zone-default', "isActive", "createdAt", "updatedAt" FROM "sites";
DROP TABLE "sites";
ALTER TABLE "new_sites" RENAME TO "sites";
CREATE INDEX "sites_orgUnitId_idx" ON "sites"("orgUnitId");
CREATE INDEX "sites_status_idx" ON "sites"("status");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "department" TEXT,
    "position" TEXT,
    "role" TEXT NOT NULL,
    "orgUnitId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- Migrate existing users with default roles and assign to PMO
INSERT INTO "new_users" ("id", "username", "email", "passwordHash", "firstName", "lastName", "phoneNumber", "department", "position", "role", "orgUnitId", "isActive", "lastLogin", "createdAt", "updatedAt")
SELECT "id", "username", "email", "passwordHash", "firstName", "lastName", "phoneNumber", "department", "position", 'ADMIN', 'pmo-root', "isActive", "lastLogin", "createdAt", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "org_units_parentId_idx" ON "org_units"("parentId");

-- CreateIndex
CREATE INDEX "org_units_type_idx" ON "org_units"("type");

-- CreateIndex
CREATE UNIQUE INDEX "user_org_assignments_userId_orgUnitId_key" ON "user_org_assignments"("userId", "orgUnitId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "tasks_siteId_idx" ON "tasks"("siteId");

-- CreateIndex
CREATE INDEX "tasks_orgUnitId_idx" ON "tasks"("orgUnitId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_approvalStatus_idx" ON "tasks"("approvalStatus");

-- CreateIndex
CREATE INDEX "task_updates_taskId_idx" ON "task_updates"("taskId");

-- CreateIndex
CREATE INDEX "task_approvals_taskId_idx" ON "task_approvals"("taskId");

-- CreateIndex
CREATE INDEX "expenses_siteId_idx" ON "expenses"("siteId");

-- CreateIndex
CREATE INDEX "expenses_orgUnitId_idx" ON "expenses"("orgUnitId");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "revenues_siteId_idx" ON "revenues"("siteId");

-- CreateIndex
CREATE INDEX "revenues_orgUnitId_idx" ON "revenues"("orgUnitId");

-- CreateIndex
CREATE INDEX "revenues_clientId_idx" ON "revenues"("clientId");

-- CreateIndex
CREATE INDEX "revenues_status_idx" ON "revenues"("status");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receiptNumber_key" ON "receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "receipts_clientId_idx" ON "receipts"("clientId");

-- CreateIndex
CREATE INDEX "receipts_siteId_idx" ON "receipts"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "employees"("employeeNumber");

-- CreateIndex
CREATE INDEX "employees_siteId_idx" ON "employees"("siteId");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "safes_siteId_idx" ON "safes"("siteId");

-- CreateIndex
CREATE INDEX "safes_orgUnitId_idx" ON "safes"("orgUnitId");

-- CreateIndex
CREATE INDEX "safe_transactions_safeId_idx" ON "safe_transactions"("safeId");

-- CreateIndex
CREATE INDEX "safe_transactions_orgUnitId_idx" ON "safe_transactions"("orgUnitId");

-- CreateIndex
CREATE INDEX "safe_transactions_status_idx" ON "safe_transactions"("status");

-- CreateIndex
CREATE INDEX "payroll_runs_orgUnitId_idx" ON "payroll_runs"("orgUnitId");

-- CreateIndex
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_siteId_month_year_key" ON "payroll_runs"("siteId", "month", "year");

-- CreateIndex
CREATE INDEX "payslips_employeeId_idx" ON "payslips"("employeeId");

-- CreateIndex
CREATE INDEX "payslips_payrollRunId_idx" ON "payslips"("payrollRunId");

-- CreateIndex
CREATE INDEX "payslips_status_idx" ON "payslips"("status");
