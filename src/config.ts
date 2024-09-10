import path from 'path';

export const SESSIONS_DIR: string = path
  .resolve(__dirname, '.wwebjs_auth')
  .replace('/src', '');

export const CLIENTS_FILE_PATH: string =
  process.env.CLIENTS_FILE_PATH || './clients.json';

export const MESSAGE_PREFIX: string = process.env.MESSAGE_PREFIX || 'Pergunta:';
