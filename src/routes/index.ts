import { Router } from 'express';

import {
  addCallbackUrlToClient,
  doClientDisconnection,
  fetchClients,
  getQRCodeByUUID,
  healthCheck,
  registerClient,
  sendMedia,
  sendMessage,
} from '../controllers';

const router = Router();

router.get('/health', healthCheck);
router.get('/register', registerClient);
router.get('/clients', fetchClients);
router.post('/sendMessage', sendMessage);
router.get('/getQRCode/:uuid', getQRCodeByUUID);
router.delete('/disconnect/:uuid', doClientDisconnection);
router.post('/sendMedia', sendMedia);
router.post('/addCallbackUrl', addCallbackUrlToClient);

export default router;
