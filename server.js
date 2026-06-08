const app = require("./src/app");
const { seedIfNeeded } = require("./src/services/seed.service");

const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.APP_ENV === "PROD";

function validateStartupEnvironment() {
  const required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD", "SESSION_DAYS", "PASSWORD_ITERATIONS"];
  if (IS_PRODUCTION) required.push("FRONTEND_ORIGINS");
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

Promise.resolve()
  .then(validateStartupEnvironment)
  .then(seedIfNeeded)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LinguaStories listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start LinguaStories:", error);
    process.exit(1);
  });
