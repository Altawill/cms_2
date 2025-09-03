-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "currentApprover" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL,
    "orgUnitId" TEXT NOT NULL,
    "approvalChain" TEXT,
    "metadata" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "approval_workflows_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approvalWorkflowId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "remark" TEXT,
    "requiredThreshold" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "approval_steps_approvalWorkflowId_fkey" FOREIGN KEY ("approvalWorkflowId") REFERENCES "approval_workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "approval_steps_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "approval_workflows_entityType_entityId_idx" ON "approval_workflows"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "approval_workflows_status_idx" ON "approval_workflows"("status");

-- CreateIndex
CREATE INDEX "approval_workflows_currentApprover_idx" ON "approval_workflows"("currentApprover");

-- CreateIndex
CREATE INDEX "approval_workflows_orgUnitId_idx" ON "approval_workflows"("orgUnitId");

-- CreateIndex
CREATE INDEX "approval_steps_approvalWorkflowId_idx" ON "approval_steps"("approvalWorkflowId");

-- CreateIndex
CREATE INDEX "approval_steps_status_idx" ON "approval_steps"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
