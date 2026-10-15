const express = require("express");
const authRoutes = require("./auth.routes");
const configRoutes = require("./config.routes");
const contentRoutes = require("./content.routes");
const healthRoutes = require("./health.routes");

const router = express.Router();

router.use(configRoutes);
router.use(contentRoutes);
router.use("/auth", authRoutes);
router.use(healthRoutes);

module.exports = router;
