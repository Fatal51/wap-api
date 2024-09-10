import { Request, Response } from 'express';

import { ClientNotFoundError } from '../errors';
import { addCallbackUrl } from '../service';
import { logger } from '../utils';

export const addCallbackUrlToClient = async (req: Request, res: Response) => {
  const { clientId, callbackURL } = req.body;

  if (!clientId || !callbackURL) {
    return res.status(400).json({
      success: false,
      error: 'Missing parameters: clientId and callbackURL are required',
    });
  }

  if (typeof clientId !== 'string' || typeof callbackURL !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid parameters: clientId and callbackURL must be strings',
    });
  }

  try {
    addCallbackUrl(clientId, callbackURL);
    res
      .status(200)
      .json({ success: true, message: 'Callback URL added successfully' });
  } catch (error) {
    if (error instanceof ClientNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      logger.error('Error adding callback URL:', error);
      res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  }
};
