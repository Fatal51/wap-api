import fs from 'fs';
import path from 'path';

import { logger } from './logger';
import { SESSIONS_DIR } from '../config';
import { getClients } from '../service';

export const cleanUpSessions = (): void => {
  const clientsIds = getClients().map((client) => client.clientId);

  fs.readdir(SESSIONS_DIR, (err, files) => {
    if (err) {
      return logger.error('Erro ao ler a pasta de sessões:', err);
    }

    files.forEach((file) => {
      const sessionId = file.replace('session-', '');
      if (!clientsIds.includes(sessionId)) {
        const sessionPath = path.join(SESSIONS_DIR, file);
        fs.rm(sessionPath, { recursive: true, force: true }, (err) => {
          if (err) {
            logger.error(`Erro ao remover a sessão ${sessionId}:`, err);
          } else {
            logger.info(`Sessão ${sessionId} removida com sucesso.`);
          }
        });
      }
    });
  });
};
