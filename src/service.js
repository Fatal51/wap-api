const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs-extra');

const CLIENTS_FILE_PATH = process.env.CLIENTS_FILE_PATH || './clients.json';
let clients = {};
let qrCodes = {};


if (fs.existsSync(CLIENTS_FILE_PATH)) {
    const clientIds = fs.readJsonSync(CLIENTS_FILE_PATH);
    clientIds.forEach(id => {
        initializeClient(id);
    });
}

function saveClientsToFile() {
    const clientIds = Object.keys(clients);
    fs.writeJsonSync(CLIENTS_FILE_PATH, clientIds);
}

function getClients() {
    return Object.keys(clients).map(id => ({ clientId: id, qrCode: qrCodes[id] }));
}

function getQrCode(id) {
    return qrCodes[id];
}

function deleteQrcode(id) {
    delete qrCodes[id];
}

function waitForQrCode(id) {
    return new Promise((resolve, reject) => {
        const checkQrCode = () => {
            if (qrCodes[id]) {
                resolve(qrCodes[id]);
            } else {
                setTimeout(checkQrCode, 1000);
            }
        };
        checkQrCode();
    });
}

function disconnectClient(id) {
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

function initializeClient(id) {
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: id
        })
    });

    client.on('qr', qr => {
        try {
            qrcode.toDataURL(qr, (err, url) => {
                if (err) {
                    console.error('Erro ao gerar QR code em base64:', err);
                    return;
                }
                qrCodes[id] = url;
            });
        } catch (error) {
            console.error('Erro ao gerar QR code:', error);
        }
        
    });

    client.on('ready', () => {
        console.log(`Cliente ${id} está pronto!`);
        deleteQrcode(id);
    });

    client.on('authenticated', () => {
        console.log(`Cliente ${id} autenticado com sucesso`);
        deleteQrcode(id);
    });

    client.on('auth_failure', msg => {
        console.error(`Falha na autenticação do cliente ${id}:`, msg);
        deleteQrcode(id);
    });

    client.on('message', async message => {
        let hello_msg = "Mensagem padrão";
        let msg = message.body.toLowerCase().trim();

        if (msg.includes("teste")) {
            if (msg.startsWith('teste ')) {
                const parametro = msg.slice(6).trim();
                let resposta = `Exemplo de resposta para ${parametro}`;
                await message.reply(resposta);
            } else {
                await message.reply(hello_msg);
            }
        }
    });

    client.on('disconnected', () => {
        console.log(`Cliente ${id} desconectado.`);
        delete clients[id];
        deleteQrcode(id);
        saveClientsToFile();
    });

    client.initialize();
    clients[id] = client;
    saveClientsToFile();
}

module.exports = { initializeClient, clients, getQrCode, waitForQrCode, disconnectClient, getClients };
