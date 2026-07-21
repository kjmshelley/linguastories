const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const teacherStudentController = require("../controllers/teacher-student.controller");

const router = express.Router();

router.get("/public/teachers", asyncHandler(teacherStudentController.searchPublicTeachers));

module.exports = router;
