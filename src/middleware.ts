import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import { Writable } from 'stream';

import { logger } from './utils';

const stream = new Writable({
  write: (message: Buffer) => {
    logger.info(message.toString().trim());
  },
});

export const setupMiddleware = (app: express.Application) => {
  app.use(bodyParser.json());
  app.use(morgan('combined', { stream }));
};
