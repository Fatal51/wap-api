const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const CLIENTS_FILE_PATH = './clients.json';
let clients = {};

if (fs.existsSync(CLIENTS_FILE_PATH)) {
    const clientIds = fs.readJsonSync(CLIENTS_FILE_PATH);
    clientIds.forEach(id => {
        initializeClient(id);
    });
}

app.use(bodyParser.json());

function saveClientsToFile() {
    const clientIds = Object.keys(clients);
    fs.writeJsonSync(CLIENTS_FILE_PATH, clientIds);
}

function initializeClient(id) {
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: id
        })
    });

    client.on('qr', qr => {
        console.log(`QR Code para o cliente ${id}:`);
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log(`Cliente ${id} está pronto!`);
    });

    client.on('authenticated', () => {
        console.log(`Cliente ${id} autenticado com sucesso`);
    });

    client.on('auth_failure', msg => {
        console.error(`Falha na autenticação do cliente ${id}:`, msg);
    });

    client.on('message', async message => {
        let hello_msg = "Mensagem padrão";
        let msg = message.body.toLowerCase().trim();

        console.log(`Mensagem recebida no cliente ${id}: ${msg}`);

        if (msg.includes("teste")) {
            if (msg.startsWith('teste ')) {
                const parametro = msg.slice(6).trim();
                let resposta = `Exemplo de resposta para ${parametro}`;
                await message.reply(resposta);
            } else {
                await message.reply(hello_msg);
            }
        } else {
            await message.reply(hello_msg);
        }
    });

    client.on('disconnected', () => {
        console.log(`Cliente ${id} desconectado.`);
        delete clients[id];
        saveClientsToFile();
    });

    client.initialize();
    clients[id] = client;
    saveClientsToFile();
}

app.get('/register', (req, res) => {
    const id = uuidv4();
    initializeClient(id);
    res.status(200).send({ success: true, clientId: id });
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

app.listen(PORT, () => {
    console.log(`Servidor HTTP rodando na porta ${PORT}`);
});
