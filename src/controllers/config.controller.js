const configService = require("../services/config.service");

async function config(_req, res) {
  res.json(await configService.getPublicConfig());
}

module.exports = { config };
