import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import fs from "fs-extra";

const CLIENTS_FILE_PATH: string =
  process.env.CLIENTS_FILE_PATH || "./clients.json";

interface ClientInfo {
  clientId: string;
  qrCode?: string;
}

let clients: Record<string, Client> = {};
let qrCodes: Record<string, string> = {};

if (fs.existsSync(CLIENTS_FILE_PATH)) {
  const clientIds: string[] = fs.readJsonSync(CLIENTS_FILE_PATH);
  clientIds.forEach((id) => {
    initializeClient(id);
  });
}

function saveClientsToFile(): void {
  const clientIds = Object.keys(clients);
  fs.writeJsonSync(CLIENTS_FILE_PATH, clientIds);
}

function getClients(): ClientInfo[] {
  return Object.keys(clients).map((id) => ({
    clientId: id,
    qrCode: qrCodes[id],
  }));
}

function getQrCode(id: string): string | undefined {
  return qrCodes[id];
}

function deleteQrcode(id: string): void {
  delete qrCodes[id];
}

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

function disconnectClient(id: string): boolean {
  const client = clients[id];
  if (client) {
    client.destroy();
    delete clients[id];
    saveClientsToFile();
    console.log(`Cliente ${id} foi desconectado e removido.`);
    return true;
  }
  return false;
}

function initializeClient(id: string): void {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });

  client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error("Erro ao gerar QR code em base64:", err);
        return;
      }
      qrCodes[id] = url;
    });
  });

  client.on("ready", () => {
    console.log(`Cliente ${id} está pronto!`);
    deleteQrcode(id);
  });

  client.on("authenticated", () => {
    console.log(`Cliente ${id} autenticado com sucesso`);
    deleteQrcode(id);
  });

  client.on("auth_failure", (msg) => {
    console.error(`Falha na autenticação do cliente ${id}:`, msg);
    deleteQrcode(id);
  });

  client.on("message", async (message) => {
    const hello_msg = "Mensagem padrão";
    const msg = message.body.toLowerCase().trim();

    if (msg.includes("teste")) {
      if (msg.startsWith("teste ")) {
        const parametro = msg.slice(6).trim();
        const resposta = `Exemplo de resposta para ${parametro}`;
        await message.reply(resposta);
      } else {
        await message.reply(hello_msg);
      }
    }
  });

  client.on("disconnected", () => {
    console.log(`Cliente ${id} desconectado.`);
    delete clients[id];
    deleteQrcode(id);
    saveClientsToFile();
  });

  client.initialize();
  clients[id] = client;
  saveClientsToFile();
}

export {
  initializeClient,
  clients,
  getQrCode,
  waitForQrCode,
  disconnectClient,
  getClients,
};
