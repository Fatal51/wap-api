import axios from 'axios';
import fs from 'fs-extra';
import qrcode from 'qrcode';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';

import { CLIENTS_FILE_PATH, MESSAGE_PREFIX } from './config';
import { ClientNotFoundError } from './errors/ClientNotFoundError';
import { logger } from './utils/logger';

interface ClientInfo {
  clientId: string;
  qrCode?: string;
  callbackURL?: string;
}

interface CustomClient extends Client {
  callbackURL?: string;
}

const clients: Record<string, CustomClient> = {};
const qrCodes: Record<string, string> = {};

// Initialize clients from file
if (fs.existsSync(CLIENTS_FILE_PATH)) {
  try {
    const savedClients: ClientInfo[] = fs.readJsonSync(CLIENTS_FILE_PATH);
    savedClients.forEach(({ clientId, callbackURL }) => {
      initializeClient(clientId, callbackURL); // Pass the callbackURL during initialization
    });
  } catch (error) {
    logger.error('Failed to read clients from file:', error);
  }
}

// Save clients to file
function saveClientsToFile(): void {
  const clientData: ClientInfo[] = Object.keys(clients).map((id) => ({
    clientId: id,
    callbackURL: clients[id].callbackURL, // Save callbackURL
  }));

  try {
    fs.writeJsonSync(CLIENTS_FILE_PATH, clientData);
  } catch (error) {
    logger.error('Failed to save clients to file:', error);
    throw new Error(`Failed to save clients to file: ${error}`);
  }
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
    try {
      saveClientsToFile();
      logger.info(`Cliente ${id} foi desconectado e removido.`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to save clients to file after disconnecting client ${id}:`,
        error,
      );
      return false;
    }
  }
  return false;
}

// Initialize a client
function initializeClient(id: string, callbackURL?: string): void {
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
  client.on('message_create', (msg) => handleMessage(id, msg));
  client.on('disconnected', () => handleClientDisconnected(id));

  client.initialize();
  clients[id] = client;

  // Store the callbackURL in the client object
  if (callbackURL) {
    clients[id].callbackURL = callbackURL;
  }

  try {
    saveClientsToFile();
  } catch (error) {
    logger.error(
      `Failed to save clients to file after initializing client ${id}:`,
      error,
    );
  }
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
  triggerClientCallback(id, `Cliente ${id} está pronto!`, 'READY');
  deleteQrCode(id);

  logger.info(`Cliente ${id} está pronto!`);
}

// Handle client authenticated event
function handleClientAuthenticated(id: string): void {
  triggerClientCallback(
    id,
    `Cliente ${id} autenticado com sucesso`,
    'AUTHENTICATED',
  );
  deleteQrCode(id);

  logger.info(`Cliente ${id} autenticado com sucesso`);
}

// Handle authentication failure
function handleAuthFailure(id: string, msg: string): void {
  triggerClientCallback(
    id,
    `Falha na autenticação do cliente ${id}: ${msg}`,
    'AUTH_FAILURE',
  );
  deleteQrCode(id);

  logger.error(`Falha na autenticação do cliente ${id}:`, msg);
}

// Handle incoming messages
async function handleMessage(
  clientId: string,
  message: Message,
): Promise<void> {
  const client = clients[clientId];
  if (!client) return;

  const msg = message.body.toLowerCase().trim();

  if (msg.startsWith(MESSAGE_PREFIX)) {
    logger.info(`Mensagem recebida de ${message.from}: ${msg}`);
    triggerClientCallback(clientId, msg, 'MESSAGE', {
      numeroFrom: message.from.replace('@c.us', ''),
    });
  }
}

// Handle client disconnected event
function handleClientDisconnected(id: string): void {
  delete clients[id];
  deleteQrCode(id);
  try {
    saveClientsToFile();
  } catch (error) {
    logger.error(
      `Failed to save clients to file after client ${id} disconnected:`,
      error,
    );
  }
  triggerClientCallback(id, `Cliente ${id} desconectado`, 'DISCONNECTED');

  logger.info(`Cliente ${id} desconectado.`);
}

// Add callback URL to client
function addCallbackUrl(id: string, url: string): void {
  if (clients[id]) {
    clients[id].callbackURL = url;
    try {
      saveClientsToFile();
    } catch (error) {
      logger.error(
        `Failed to save clients to file after adding callback URL for client ${id}:`,
        error,
      );
      throw new Error(`Failed to save clients to file: ${error}`);
    }
  } else {
    throw new ClientNotFoundError(id);
  }
}

function getCallbackUrl(id: string): string {
  if (clients[id]) {
    return clients[id].callbackURL || '';
  }
  throw new ClientNotFoundError(id);
}

function triggerClientCallback(
  clientId: string,
  message: string,
  type: string,
  additionalData?: Record<string, unknown>,
): void {
  const callbackURL = getCallbackUrl(clientId);
  if (callbackURL) {
    try {
      axios.post(callbackURL, {
        clientId,
        message: message.replace(MESSAGE_PREFIX, ''),
        type,
        additionalData,
      });
      logger.info(`Message sent to callback URL for client ${clientId}`);
    } catch (error) {
      logger.error(
        `Failed to send message to callback URL for client ${clientId}:`,
        error,
      );
    }
  } else {
    logger.warn(
      `Este número não está configurado para receber mensagens: ${clientId}`,
    );
  }
}

export {
  addCallbackUrl,
  clients,
  disconnectClient,
  getClients,
  getQrCode,
  initializeClient,
  waitForQrCode,
};
