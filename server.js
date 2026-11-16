const express = require('express');
const path = require('path');
const { securityHeaders, cors, rejectInvalidContentType } = require('./src/middleware/security.middleware');
const { rejectPrototypePollution } = require('./src/middleware/validation.middleware');
const app = express();
const client = path.join(__dirname, 'client');
app.disable('x-powered-by');
app.use(securityHeaders, cors, express.json({limit:'32kb'}), rejectPrototypePollution, rejectInvalidContentType);
app.use('/api/reader', require('./src/reader'));
app.get('/content/catalog.json', (_req,res) => res.sendFile(path.join(__dirname, 'data', 'catalog.json')));
app.use('/content/stories', express.static(path.join(__dirname, 'data', 'stories')));
app.use('/content/translations', express.static(path.join(__dirname, 'data', 'translations')));
app.use('/vendor/ubuntu', express.static(path.join(__dirname, 'node_modules', '@fontsource', 'ubuntu')));
app.use('/assets', express.static(path.join(client, 'assets')));
app.use('/reader', express.static(path.join(client, 'reader')));
app.get(['/', '/library', '/library/genre/:slug', '/story/:id'], (_req,res) => res.sendFile(path.join(client,'reader','index.html')));
app.use((req,res)=>{if(req.method==='GET' && !req.path.startsWith('/api/') && req.accepts('html')) return res.status(404).sendFile(path.join(client,'reader','index.html'));res.status(404).send('Page not found');});
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`LinguaStories listening on http://localhost:${port}`));
}
module.exports = app;
