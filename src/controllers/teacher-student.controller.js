const teacherStudentService = require("../services/teacher-student.service");

async function searchTeachers(req, res) {
  res.json(await teacherStudentService.searchTeachers(req.user, req.query));
}

async function getProfile(req, res) {
  res.json(await teacherStudentService.getProfile(req.user, req.params.id));
}

async function myProfiles(req, res) {
  res.json(await teacherStudentService.myProfiles(req.user));
}

async function createProfile(req, res) {
  res.status(201).json(await teacherStudentService.saveProfile(req.user, req.body));
}

async function updateProfile(req, res) {
  res.json(await teacherStudentService.saveProfile(req.user, req.body, req.params.id));
}

async function deleteProfile(req, res) {
  res.json(await teacherStudentService.deleteProfile(req.user, req.params.id));
}

async function enableProfile(req, res) {
  res.json(await teacherStudentService.enableProfile(req.user, req.params.id));
}

async function getAvailability(req, res) {
  res.json(await teacherStudentService.getAvailability(req.user));
}

async function saveAvailability(req, res) {
  res.status(201).json(await teacherStudentService.saveAvailability(req.user, req.body));
}

async function getBookingPage(req, res) {
  res.json(await teacherStudentService.getBookingPage(req.user, req.params.id, req.query));
}

async function availableDays(req, res) {
  res.json(await teacherStudentService.availableDays(req.user, req.params.id, req.query));
}

async function availableSlots(req, res) {
  res.json(await teacherStudentService.availableSlots(req.user, req.params.id, req.query));
}

async function createBooking(req, res) {
  res.status(201).json(await teacherStudentService.createBooking(req.user, req.body));
}

async function syncStripePayment(req, res) {
  res.json(await teacherStudentService.syncStripePayment(req.user, req.params.id));
}

async function listLessons(req, res) {
  res.json(await teacherStudentService.listLessons(req.user));
}

async function listMyTeachers(req, res) {
  res.json(await teacherStudentService.listMyTeachers(req.user));
}

async function teacherDashboard(req, res) {
  res.json(await teacherStudentService.teacherDashboard(req.user));
}

async function teacherCalendar(req, res) {
  res.json(await teacherStudentService.teacherCalendar(req.user, req.query));
}

async function cancelBooking(req, res) {
  res.json(await teacherStudentService.cancelBooking(req.user, req.params.id, req.body));
}

async function saveBookingRules(req, res) {
  res.json(await teacherStudentService.saveBookingRules(req.user, req.body));
}

async function createUnavailableBlock(req, res) {
  res.status(201).json(await teacherStudentService.createUnavailableBlock(req.user, req.body));
}

async function deleteUnavailableBlock(req, res) {
  res.json(await teacherStudentService.deleteUnavailableBlock(req.user, req.params.blockId));
}

async function createRescheduleRequest(req, res) {
  res.status(201).json(await teacherStudentService.createRescheduleRequest(req.user, req.params.id, req.body));
}

async function respondToRescheduleRequest(req, res) {
  res.json(await teacherStudentService.respondToRescheduleRequest(req.user, req.params.requestId, req.body));
}

async function classroomToken(req, res) {
  res.json(await teacherStudentService.classroomToken(req.user, req.params.id));
}

async function leaveClassroom(req, res) {
  res.json(await teacherStudentService.leaveClassroom(req.user, req.params.id));
}

async function listNotes(req, res) {
  res.json(await teacherStudentService.listNotes(req.user));
}

async function createNote(req, res) {
  res.status(201).json(await teacherStudentService.createNote(req.user, req.body));
}

async function listResources(req, res) {
  res.json(await teacherStudentService.listResources(req.user));
}

async function createResource(req, res) {
  res.status(201).json(await teacherStudentService.createResource(req.user, req.body));
}

async function listTemplates(req, res) {
  res.json(await teacherStudentService.listTemplates(req.user));
}

async function createTemplate(req, res) {
  res.status(201).json(await teacherStudentService.createTemplate(req.user, req.body));
}

async function createReview(req, res) {
  res.status(201).json(await teacherStudentService.createReview(req.user, req.params.id, req.body));
}

async function sendMessage(req, res) {
  res.json(await teacherStudentService.sendTeacherMessage(req.user, req.body));
}

async function subscription(req, res) {
  res.json({ subscription: await teacherStudentService.teacherSubscriptionForUser(req.user.id) });
}

async function stripeWebhook(req, res) {
  res.json(await teacherStudentService.handleStripeWebhook(req));
}

module.exports = {
  searchTeachers,
  getProfile,
  myProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  enableProfile,
  getAvailability,
  saveAvailability,
  getBookingPage,
  availableDays,
  availableSlots,
  createBooking,
  syncStripePayment,
  listLessons,
  listMyTeachers,
  teacherDashboard,
  teacherCalendar,
  cancelBooking,
  saveBookingRules,
  createUnavailableBlock,
  deleteUnavailableBlock,
  createRescheduleRequest,
  respondToRescheduleRequest,
  classroomToken,
  leaveClassroom,
  listNotes,
  createNote,
  listResources,
  createResource,
  listTemplates,
  createTemplate,
  createReview,
  sendMessage,
  subscription,
  stripeWebhook
};
