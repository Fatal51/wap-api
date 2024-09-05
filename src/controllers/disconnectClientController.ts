import { Request, Response } from 'express';

import { disconnectClient } from '../service';

export const doClientDisconnection = (req: Request, res: Response) => {
  const { uuid } = req.params;
  const success = disconnectClient(uuid);
  if (success) {
    res.status(200).send({
      success: true,
      message: `Cliente ${uuid} desconectado com sucesso`,
    });
  } else {
    res.status(404).send({ success: false, message: 'Cliente não encontrado' });
  }
};
