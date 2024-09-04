import { Request, Response } from 'express';

import { getQrCode } from '../service';

export const getQRCodeByUUID = (req: Request, res: Response) => {
  const { uuid } = req.params;
  const qrCode = getQrCode(uuid);
  if (qrCode) {
    res.status(200).send({ success: true, qrCode });
  } else {
    res.status(404).send({
      success: false,
      message: 'QR Code não encontrado ou cliente já autenticado',
    });
  }
};
