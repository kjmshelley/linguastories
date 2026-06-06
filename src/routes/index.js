const express = require("express");
const authRoutes = require("./auth.routes");
const configRoutes = require("./config.routes");
const healthRoutes = require("./health.routes");
const learningRoutes = require("./learning.routes");

const router = express.Router();

router.use(configRoutes);
router.use("/auth", authRoutes);
router.use(healthRoutes);
router.use(learningRoutes);

module.exports = router;
