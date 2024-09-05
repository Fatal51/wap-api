import app from './api';
import { logger } from './utils';

import 'dotenv/config';

const PORT: string | number = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`Servidor HTTP rodando na porta ${PORT}`);
});

export default server; // Export the server instance
