const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth } = require("../middleware/auth.middleware");
const { rateLimit, uploadRateLimit } = require("../middleware/rate-limit.middleware");
const { validateBody, validateUuidParam } = require("../middleware/validation.middleware");
const controller = require("../controllers/teacher-student.controller");
const { LANGUAGE_SKILL_LEVELS } = require("../constants/language-levels");

const router = express.Router();

const classroomRateLimit = rateLimit({
  keyPrefix: "teacher-student",
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Too many classroom requests. Please try again shortly."
});

const profileSchema = {
  displayName: { type: "string", required: true, min: 2, max: 120, label: "Display name" },
  headline: { type: "string", required: true, min: 3, max: 160, label: "Headline" },
  bio: { type: "string", required: true, min: 20, max: 3000, label: "Bio" },
  teachingStyle: { type: "string", max: 1200, label: "Teaching style" },
  experienceSummary: { type: "string", max: 1200, label: "Experience" },
  certifications: { type: "string", max: 1000, label: "Certifications" },
  nativeLanguage: { type: "string", required: true, max: 80, label: "Native language" },
  timezone: { type: "string", required: true, max: 80, label: "Timezone" },
  country: { type: "string", max: 80, label: "Country of birth" },
  professionalTutor: { type: "enum", options: ["true", "false", true, false], fallback: true, label: "Professional tutor" },
  speakingPracticeOnly: { type: "enum", options: ["true", "false", true, false], fallback: false, label: "Speaking practice tutor" },
  hourlyRateUsd: { type: "string", required: true, max: 20, label: "Hourly rate" },
  trialRateUsd: { type: "string", max: 20, label: "Trial rate" },
  minLessonMinutes: { type: "integer", min: 15, max: 90, label: "Minimum lesson minutes" },
  maxLessonMinutes: { type: "integer", min: 15, max: 90, label: "Maximum lesson minutes" },
  groupLessonEnabled: { type: "enum", options: ["true", "false", true, false], fallback: false, label: "Group lessons" },
  groupMaxStudents: { type: "integer", min: 1, max: 8, label: "Group max students" },
  videoIntroUrl: { type: "string", max: 500, label: "Intro video" },
  teachesLanguages: { type: "string", required: true, max: 500, label: "Languages taught" },
  speaksLanguages: { type: "string", max: 500, label: "Languages spoken" },
  teachesLanguageLevels: { type: "string", max: 1200, label: "Taught language levels" },
  speaksLanguageLevels: { type: "string", max: 1200, label: "Spoken language levels" },
  cefrLevel: { type: "enum", options: LANGUAGE_SKILL_LEVELS, fallback: "A1", label: "Skill level" },
  tags: { type: "string", max: 500, label: "Tags" }
};

router.use(requireAuth);
router.use(classroomRateLimit);
router.param("id", validateUuidParam);
router.param("blockId", validateUuidParam);
router.param("requestId", validateUuidParam);

router.get("/teachers", asyncHandler(controller.searchTeachers));
router.get("/teacher-profiles/my", asyncHandler(controller.myProfiles));
router.post("/teacher-profiles", uploadRateLimit, validateBody(profileSchema), asyncHandler(controller.createProfile));
router.get("/teacher-profiles/:id", asyncHandler(controller.getProfile));
router.get("/teacher-profiles/:id/booking-page", asyncHandler(controller.getBookingPage));
router.get("/teacher-profiles/:id/available-days", asyncHandler(controller.availableDays));
router.get("/teacher-profiles/:id/available-slots", asyncHandler(controller.availableSlots));
router.post("/teacher-profiles/:id", uploadRateLimit, validateBody(profileSchema), asyncHandler(controller.updateProfile));
router.delete("/teacher-profiles/:id", asyncHandler(controller.deleteProfile));
router.post("/teacher-profiles/:id/reviews", validateBody({
  lessonBookingId: { type: "uuid", required: true, label: "Lesson" },
  rating: { type: "integer", required: true, min: 1, max: 5, label: "Rating" },
  body: { type: "string", max: 1000, label: "Review" }
}), asyncHandler(controller.createReview));

router.get("/dashboard", asyncHandler(controller.teacherDashboard));
router.get("/calendar", asyncHandler(controller.teacherCalendar));
router.post("/calendar/blocks", validateBody({
  teacherProfileId: { type: "uuid", required: true, label: "Teacher profile" },
  title: { type: "string", max: 160, label: "Title" },
  startsAt: { type: "string", required: true, max: 80, label: "Start time" },
  endsAt: { type: "string", required: true, max: 80, label: "End time" },
  timezone: { type: "string", max: 80, label: "Timezone" },
  reason: { type: "string", max: 500, label: "Reason" },
  isFullDay: { type: "enum", options: ["true", "false", true, false], fallback: false, label: "Full day" }
}), asyncHandler(controller.createUnavailableBlock));
router.delete("/calendar/blocks/:blockId", asyncHandler(controller.deleteUnavailableBlock));
router.post("/booking-rules", validateBody({
  teacherProfileId: { type: "uuid", required: true, label: "Teacher profile" },
  minBookingNoticeMinutes: { type: "integer", min: 0, max: 43200, label: "Minimum notice" },
  maxAdvanceBookingDays: { type: "integer", min: 1, max: 365, label: "Advance window" },
  bufferBeforeMinutes: { type: "integer", min: 0, max: 240, label: "Buffer before" },
  bufferAfterMinutes: { type: "integer", min: 0, max: 240, label: "Buffer after" },
  cancellationCutoffMinutes: { type: "integer", min: 0, max: 43200, label: "Cancellation cutoff" },
  rescheduleCutoffMinutes: { type: "integer", min: 0, max: 43200, label: "Reschedule cutoff" },
  supportedDurations: { type: "string", max: 80, label: "Supported durations" }
}), asyncHandler(controller.saveBookingRules));
router.get("/availability", asyncHandler(controller.getAvailability));
router.post("/availability", validateBody({
  teacherProfileId: { type: "uuid", required: true, label: "Teacher profile" },
  weekday: { type: "integer", required: true, min: 0, max: 6, label: "Weekday" },
  startTime: { type: "string", required: true, max: 8, label: "Start time" },
  endTime: { type: "string", required: true, max: 8, label: "End time" },
  timezone: { type: "string", max: 80, label: "Timezone" }
}), asyncHandler(controller.saveAvailability));

router.post("/bookings", validateBody({
  teacherProfileId: { type: "uuid", required: true, label: "Teacher profile" },
  lessonType: { type: "enum", options: ["trial", "one_on_one", "group"], fallback: "one_on_one", label: "Lesson type" },
  title: { type: "string", max: 160, label: "Lesson title" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  startsAt: { type: "string", required: true, max: 80, label: "Start time" },
  durationMinutes: { type: "integer", required: true, min: 15, max: 90, label: "Duration" },
  maxStudents: { type: "integer", min: 1, max: 8, label: "Max students" }
}), asyncHandler(controller.createBooking));
router.get("/lessons", asyncHandler(controller.listLessons));
router.get("/my-teachers", asyncHandler(controller.listMyTeachers));
router.post("/bookings/:id/sync-payment", asyncHandler(controller.syncStripePayment));
router.post("/bookings/:id/cancel", validateBody({
  reason: { type: "string", max: 500, label: "Reason" }
}), asyncHandler(controller.cancelBooking));
router.post("/bookings/:id/reschedule-requests", validateBody({
  startsAt: { type: "string", required: true, max: 80, label: "Start time" },
  durationMinutes: { type: "integer", required: true, min: 15, max: 90, label: "Duration" },
  reason: { type: "string", max: 500, label: "Reason" }
}), asyncHandler(controller.createRescheduleRequest));
router.post("/reschedule-requests/:requestId/respond", validateBody({
  action: { type: "enum", options: ["accept", "reject"], required: true, label: "Action" }
}), asyncHandler(controller.respondToRescheduleRequest));
router.post("/bookings/:id/classroom-token", asyncHandler(controller.classroomToken));
router.post("/bookings/:id/leave-classroom", asyncHandler(controller.leaveClassroom));

router.get("/notes", asyncHandler(controller.listNotes));
router.post("/notes", validateBody({
  lessonBookingId: { type: "uuid", required: true, label: "Lesson" },
  visibility: { type: "enum", options: ["shared", "teacher_private"], fallback: "shared", label: "Visibility" },
  body: { type: "string", required: true, max: 4000, label: "Note" }
}), asyncHandler(controller.createNote));
router.get("/resources", asyncHandler(controller.listResources));
router.post("/resources", validateBody({
  teacherProfileId: { type: "uuid", label: "Teacher profile" },
  title: { type: "string", required: true, max: 160, label: "Title" },
  resourceType: { type: "enum", options: ["link", "text"], fallback: "link", label: "Resource type" },
  url: { type: "string", max: 500, label: "URL" },
  body: { type: "string", max: 4000, label: "Body" },
  visibility: { type: "enum", options: ["teacher_only", "lesson_students"], fallback: "teacher_only", label: "Visibility" }
}), asyncHandler(controller.createResource));
router.get("/templates", asyncHandler(controller.listTemplates));
router.post("/templates", validateBody({
  teacherProfileId: { type: "uuid", label: "Teacher profile" },
  title: { type: "string", required: true, max: 160, label: "Title" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  level: { type: "enum", options: LANGUAGE_SKILL_LEVELS, fallback: "A1", label: "Skill level" },
  lessonType: { type: "enum", options: ["trial", "one_on_one", "group"], fallback: "one_on_one", label: "Lesson type" },
  body: { type: "string", required: true, max: 5000, label: "Template" }
}), asyncHandler(controller.createTemplate));
router.get("/subscription", asyncHandler(controller.subscription));
router.post("/messages", validateBody({
  recipientId: { type: "uuid", required: true, label: "Recipient" },
  teacherProfileId: { type: "uuid", label: "Teacher profile" },
  lessonBookingId: { type: "uuid", label: "Lesson" },
  body: { type: "string", required: true, max: 1000, label: "Message" }
}), asyncHandler(controller.sendMessage));

module.exports = router;
