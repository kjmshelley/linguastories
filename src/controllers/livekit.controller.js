const livekitService = require("../services/livekit.service");

async function createRoom(req, res) {
  res.status(201).json(await livekitService.createRoom(req.user, req.body));
}

async function listRooms(req, res) {
  res.json(await livekitService.listRooms(req.user, req.query));
}

async function getRoom(req, res) {
  res.json(await livekitService.getRoom(req.user, req.params.id));
}

async function joinRoom(req, res) {
  res.json(await livekitService.joinRoom(req.user, req.params.id));
}

async function leaveRoom(req, res) {
  res.json(await livekitService.leaveRoom(req.user, req.params.id));
}

async function deleteRoom(req, res) {
  res.json(await livekitService.deleteRoom(req.user, req.params.id));
}

async function moderateParticipant(req, res) {
  res.json(await livekitService.moderateParticipant(req.user, req.params.id, req.params.participantId, req.body.action));
}

async function endSession(req, res) {
  res.json(await livekitService.endSession(req.user, req.params.id, req.body?.status === "timed_out" ? "timed_out" : "completed"));
}

module.exports = {
  createRoom,
  listRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
  moderateParticipant,
  endSession
};
