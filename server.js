const app = require("./src/app");
const { seedIfNeeded } = require("./src/services/seed.service");

const PORT = process.env.PORT || 3000;

seedIfNeeded()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LinguaStories listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start LinguaStories:", error);
    process.exit(1);
  });
