-- CreateIndex
CREATE INDEX "Assessment_studentId_idx" ON "Assessment"("studentId");

-- CreateIndex
CREATE INDEX "Assessment_passageId_idx" ON "Assessment"("passageId");

-- CreateIndex
CREATE INDEX "Assessment_studentId_dateTaken_idx" ON "Assessment"("studentId", "dateTaken" DESC);

-- CreateIndex
CREATE INDEX "ClassRoom_userId_idx" ON "ClassRoom"("userId");

-- CreateIndex
CREATE INDEX "ClassRoom_userId_schoolYear_idx" ON "ClassRoom"("userId", "schoolYear");

-- CreateIndex
CREATE INDEX "ComprehensionAnswer_comprehensionTestId_idx" ON "ComprehensionAnswer"("comprehensionTestId");

-- CreateIndex
CREATE INDEX "OralFluencyBehavior_sessionId_idx" ON "OralFluencyBehavior"("sessionId");

-- CreateIndex
CREATE INDEX "OralFluencyMiscue_sessionId_idx" ON "OralFluencyMiscue"("sessionId");

-- CreateIndex
CREATE INDEX "Question_quizId_idx" ON "Question"("quizId");

-- CreateIndex
CREATE INDEX "Student_classRoomId_idx" ON "Student"("classRoomId");

-- CreateIndex
CREATE INDEX "WordTimestamp_sessionId_idx" ON "WordTimestamp"("sessionId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");
