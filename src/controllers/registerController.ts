import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { initializeClient, waitForQrCode } from '../service';
import { logger } from '../utils';

export const registerClient = async (req: Request, res: Response) => {
  const id = uuidv4();
  initializeClient(id);
  try {
    const qrCode = await waitForQrCode(id);
    res.status(200).send({ success: true, clientId: id, qrCode });
  } catch (error) {
    logger.error('Error registering client:', error);
    res.status(500).send({ success: false, message: 'Erro ao gerar QR Code' });
  }
};
