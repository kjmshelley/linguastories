const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth } = require("../middleware/auth.middleware");
const { rateLimit } = require("../middleware/rate-limit.middleware");
const { validateBody, validateUuidParam } = require("../middleware/validation.middleware");
const controller = require("../controllers/livekit.controller");

const router = express.Router();

const livekitActionRateLimit = rateLimit({
  keyPrefix: "livekit-action",
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many room actions. Please try again shortly."
});

const livekitCreateRateLimit = rateLimit({
  keyPrefix: "livekit-create",
  windowMs: 60 * 60 * 1000,
  max: 6,
  message: "Too many room creation attempts. Please try again later."
});

router.use(requireAuth);
router.param("id", validateUuidParam);
router.param("participantId", validateUuidParam);

router.get("/rooms", livekitActionRateLimit, asyncHandler(controller.listRooms));
router.post("/rooms", livekitCreateRateLimit, validateBody({
  title: { type: "string", required: true, min: 3, max: 120, label: "Room title" },
  description: { type: "string", max: 1000, label: "Description" },
  roomType: { type: "enum", options: ["voice", "video"], fallback: "voice", label: "Room type" },
  targetLanguage: { type: "string", required: true, max: 80, label: "Target language" },
  sourceLanguage: { type: "string", required: true, max: 80, label: "Source language" },
  cefrLevel: { type: "enum", options: ["A1", "A2", "B1", "B2", "C1", "C2"], fallback: "A1", label: "CEFR level" },
  maxParticipants: { type: "integer", min: 2, max: 4, label: "Max participants" },
  isPrivate: { type: "enum", options: ["true", "false", true, false], fallback: false, label: "Privacy" },
  imageDataUrl: { type: "dataUrl", max: 800000, label: "Room image" },
  imageFileName: { type: "string", max: 180, label: "Room image file name" }
}), asyncHandler(controller.createRoom));
router.get("/rooms/:id", livekitActionRateLimit, asyncHandler(controller.getRoom));
router.post("/rooms/:id/join", livekitActionRateLimit, asyncHandler(controller.joinRoom));
router.post("/rooms/:id/leave", livekitActionRateLimit, asyncHandler(controller.leaveRoom));
router.delete("/rooms/:id", livekitActionRateLimit, asyncHandler(controller.deleteRoom));
router.post("/rooms/:id/participants/:participantId/moderate", livekitActionRateLimit, validateBody({
  action: { type: "enum", options: ["mute", "camera_off", "kick"], required: true, label: "Action" }
}), asyncHandler(controller.moderateParticipant));
router.post("/sessions/:id/end", livekitActionRateLimit, asyncHandler(controller.endSession));

module.exports = router;
