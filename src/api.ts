import express from 'express';
const bodyParser = require('body-parser');
import fs from 'fs';
import cron from 'node-cron';

import { SESSIONS_DIR } from './config';
import { setupMiddleware } from './middleware';
import router from './routes';
import { cleanUpSessions, logger } from './utils';

const app = express();

app.use(bodyParser.json({ limit: process.env.REQUEST_SIZE_LIMIT || '5mb' }));

// Setup middleware
setupMiddleware(app);

// Setup routes
app.use(router);

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Schedule session cleanup
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 */4 * * *', () => {
    logger.info('Executando job de limpeza de sessões...');
    cleanUpSessions();
  });
}

cleanUpSessions();

export default app;
