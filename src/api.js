const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

const { initializeClient, clients, getQrCode, waitForQrCode, disconnectClient, getClients } = require('./service');

const SESSIONS_DIR = path.resolve(__dirname, '.wwebjs_auth').replace('/src', '');

function cleanUpSessions() {
    const clientsIds = getClients().map(client => client.clientId); 

    fs.readdir(SESSIONS_DIR, (err, files) => {
        if (err) {
            return console.error('Erro ao ler a pasta de sessões:', err);
        }

        files.forEach(file => {
            const sessionId = file.replace('session-', '');
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

cron.schedule('0 */4 * * *', () => {
    console.log('Executando job de limpeza de sessões...');
    cleanUpSessions();
});

cleanUpSessions();

const app = express();

app.use(bodyParser.json()); 

app.get('/register', async (req, res) => {
    const id = uuidv4();
    initializeClient(id);
    try {
        const qrCode = await waitForQrCode(id);
        res.status(200).send({ success: true, clientId: id, qrCode });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Erro ao gerar QR Code' });
    }
});

app.get('/clients', async (req, res) => {
    res.status(200).send(getClients());
});


app.post('/sendMessage', async (req, res) => {
    const { numero, mensagem, clientId } = req.body;

    if (!numero || !mensagem || !clientId) {
        return res.status(400).send({ error: 'Número, mensagem e clientId são necessários' });
    }

    try {
        const chatId = `${numero}@c.us`;
        const client = clients[clientId];
        if (!client) {
            return res.status(404).send({ error: 'Cliente não encontrado' });
        }
        await client.sendMessage(chatId, mensagem);
        res.status(200).send({ success: true, message: 'Mensagem enviada com sucesso' });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send({ success: false, message: 'Erro ao enviar mensagem' });
    }
});

app.get('/getQRCode/:uuid', (req, res) => {
    const { uuid } = req.params;
    const qrCode = getQrCode(uuid);
    if (qrCode) {
        res.status(200).send({ success: true, qrCode });
    } else {
        res.status(404).send({ success: false, message: 'QR Code não encontrado ou cliente já autenticado' });
    }
});

app.delete('/disconnect/:uuid', (req, res) => {
    const { uuid } = req.params;
    const success = disconnectClient(uuid);
    if (success) {
        res.status(200).send({ success: true, message: `Cliente ${uuid} desconectado com sucesso` });
    } else {
        res.status(404).send({ success: false, message: 'Cliente não encontrado' });
    }
});

module.exports = app;
