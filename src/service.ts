import fs from 'fs-extra';
import qrcode from 'qrcode';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';

import { CLIENTS_FILE_PATH } from './config';
import { logger } from './utils/logger';

interface ClientInfo {
  clientId: string;
  qrCode?: string;
}

const clients: Record<string, Client> = {};
const qrCodes: Record<string, string> = {};

// Initialize clients from file
if (fs.existsSync(CLIENTS_FILE_PATH)) {
  const clientIds: string[] = fs.readJsonSync(CLIENTS_FILE_PATH);
  clientIds.forEach(initializeClient);
}

// Save clients to file
function saveClientsToFile(): void {
  const clientIds = Object.keys(clients);
  fs.writeJsonSync(CLIENTS_FILE_PATH, clientIds);
}

// Get all clients
function getClients(): ClientInfo[] {
  return Object.keys(clients).map((id) => ({
    clientId: id,
    qrCode: qrCodes[id],
  }));
}

// Get QR code for a client
function getQrCode(id: string): string | undefined {
  return qrCodes[id];
}

// Delete QR code for a client
function deleteQrCode(id: string): void {
  delete qrCodes[id];
}

// Wait for QR code to be generated
function waitForQrCode(id: string): Promise<string> {
  return new Promise((resolve) => {
    const checkQrCode = (): void => {
      if (qrCodes[id]) {
        resolve(qrCodes[id]);
      } else {
        setTimeout(checkQrCode, 1000);
      }
    };
    checkQrCode();
  });
}

// Disconnect a client
function disconnectClient(id: string): boolean {
  const client = clients[id];
  if (client) {
    client.destroy();
    delete clients[id];
    saveClientsToFile();
    logger.info(`Cliente ${id} foi desconectado e removido.`);
    return true;
  }
  return false;
}

// Initialize a client
function initializeClient(id: string): void {
  const client = new Client({
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });

  client.on('qr', (qr) => handleQrCode(id, qr));
  client.on('ready', () => handleClientReady(id));
  client.on('authenticated', () => handleClientAuthenticated(id));
  client.on('auth_failure', (msg) => handleAuthFailure(id, msg));
  client.on('message', handleMessage);
  client.on('disconnected', () => handleClientDisconnected(id));

  client.initialize();
  clients[id] = client;
  saveClientsToFile();
}

// Handle QR code generation
function handleQrCode(id: string, qr: string): void {
  qrcode.toDataURL(qr, (err, url) => {
    if (err) {
      logger.error('Erro ao gerar QR code em base64:', err);
      return;
    }
    qrCodes[id] = url;
  });
}

// Handle client ready event
function handleClientReady(id: string): void {
  logger.info(`Cliente ${id} está pronto!`);
  deleteQrCode(id);
}

// Handle client authenticated event
function handleClientAuthenticated(id: string): void {
  logger.info(`Cliente ${id} autenticado com sucesso`);
  deleteQrCode(id);
}

// Handle authentication failure
function handleAuthFailure(id: string, msg: string): void {
  logger.error(`Falha na autenticação do cliente ${id}:`, msg);
  deleteQrCode(id);
}

// Handle incoming messages
async function handleMessage(message: Message): Promise<void> {
  const hello_msg = 'Mensagem padrão';
  const msg = message.body.toLowerCase().trim();

  if (msg.includes('teste')) {
    if (msg.startsWith('teste ')) {
      const parametro = msg.slice(6).trim();
      const resposta = `Exemplo de resposta para ${parametro}`;
      await message.reply(resposta);
    } else {
      await message.reply(hello_msg);
    }
  }
}

// Handle client disconnected event
function handleClientDisconnected(id: string): void {
  logger.info(`Cliente ${id} desconectado.`);
  delete clients[id];
  deleteQrCode(id);
  saveClientsToFile();
}

export {
  clients,
  disconnectClient,
  getClients,
  getQrCode,
  initializeClient,
  waitForQrCode,
};
