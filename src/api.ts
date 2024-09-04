import express, { Request, Response } from "express";
import fs from "fs";
import bodyParser from "body-parser";
import path from "path";
import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";
import {
  initializeClient,
  clients,
  getQrCode,
  waitForQrCode,
  disconnectClient,
  getClients,
} from "./service";

const SESSIONS_DIR: string = path
  .resolve(__dirname, ".wwebjs_auth")
  .replace("/src", "");

// Check if the directory exists, and create it if it doesn't
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

function cleanUpSessions(): void {
  const clientsIds = getClients().map((client) => client.clientId);

  fs.readdir(SESSIONS_DIR, (err, files) => {
    if (err) {
      return console.error("Erro ao ler a pasta de sessões:", err);
    }

    files.forEach((file) => {
      const sessionId = file.replace("session-", "");
      if (!clientsIds.includes(sessionId)) {
        const sessionPath = path.join(SESSIONS_DIR, file);
        fs.rm(sessionPath, { recursive: true, force: true }, (err) => {
          if (err) {
            console.error(`Erro ao remover a sessão ${sessionId}:`, err);
          } else {
            console.log(`Sessão ${sessionId} removida com sucesso.`);
          }
        });
      }
    });
  });
}

if (process.env.NODE_ENV !== "test") {
  cron.schedule("0 */4 * * *", () => {
    console.log("Executando job de limpeza de sessões...");
    cleanUpSessions();
  });
}

cleanUpSessions();

const app = express();

app.use(bodyParser.json());

app.get("/register", async (req: Request, res: Response) => {
  const id = uuidv4();
  initializeClient(id);
  try {
    const qrCode = await waitForQrCode(id);
    res.status(200).send({ success: true, clientId: id, qrCode });
  } catch (error) {
    res.status(500).send({ success: false, message: "Erro ao gerar QR Code" });
  }
});

app.get("/clients", async (req: Request, res: Response) => {
  res.status(200).send(getClients());
});

app.post("/sendMessage", async (req: Request, res: Response) => {
  const { numero, mensagem, clientId } = req.body;

  if (!numero || !mensagem || !clientId) {
    return res
      .status(400)
      .send({ error: "Número, mensagem e clientId são necessários" });
  }

  try {
    const chatId = `${numero}@c.us`;
    const client = clients[clientId];
    if (!client) {
      return res.status(404).send({ error: "Cliente não encontrado" });
    }
    await client.sendMessage(chatId, mensagem);
    res
      .status(200)
      .send({ success: true, message: "Mensagem enviada com sucesso" });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res
      .status(500)
      .send({ success: false, message: "Erro ao enviar mensagem" });
  }
});

app.get("/getQRCode/:uuid", (req: Request, res: Response) => {
  const { uuid } = req.params;
  const qrCode = getQrCode(uuid);
  if (qrCode) {
    res.status(200).send({ success: true, qrCode });
  } else {
    res.status(404).send({
      success: false,
      message: "QR Code não encontrado ou cliente já autenticado",
    });
  }
});

app.delete("/disconnect/:uuid", (req: Request, res: Response) => {
  const { uuid } = req.params;
  const success = disconnectClient(uuid);
  if (success) {
    res.status(200).send({
      success: true,
      message: `Cliente ${uuid} desconectado com sucesso`,
    });
  } else {
    res.status(404).send({ success: false, message: "Cliente não encontrado" });
  }
});

export default app;
