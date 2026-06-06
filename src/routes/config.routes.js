const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const configController = require("../controllers/config.controller");

const router = express.Router();

router.get("/config", asyncHandler(configController.config));

module.exports = router;
