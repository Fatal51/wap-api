import { Request, Response } from 'express';

import { getClients } from '../service';

export const fetchClients = (req: Request, res: Response) => {
  res.status(200).send(getClients());
};
