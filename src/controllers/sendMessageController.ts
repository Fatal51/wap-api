import { Request, Response } from 'express';

import { clients } from '../service';
import { logger } from '../utils';

export const sendMessage = async (req: Request, res: Response) => {
  const { numero, mensagem, clientId } = req.body;

  if (!numero || !mensagem || !clientId) {
    return res
      .status(400)
      .send({ error: 'Número, mensagem e clientId são necessários' });
  }

  try {
    const chatId = `${numero}@c.us`;
    const client = clients[clientId];
    if (!client) {
      return res.status(404).send({ error: 'Cliente não encontrado' });
    }
    await client.sendMessage(chatId, mensagem);
    res
      .status(200)
      .send({ success: true, message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    logger.error('Erro ao enviar mensagem:', error);
    res
      .status(500)
      .send({ success: false, message: 'Erro ao enviar mensagem' });
  }
};
