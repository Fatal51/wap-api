
# WhatsApp Web Automation with Node.js

This project provides a flexible and scalable solution for automating interactions with WhatsApp using Node.js and the [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) library. It supports dynamic registration of multiple WhatsApp clients, message handling, and HTTP endpoints for sending messages. Each client session is managed using `LocalAuth`, ensuring persistence across restarts.

## Features

- **Dynamic Client Registration**: Register new WhatsApp clients dynamically via an HTTP endpoint. Each client is assigned a unique UUID.
- **Persistent Sessions**: Client sessions are persistent across server restarts using `LocalAuth`. UUIDs are saved in a JSON file.
- **Message Handling**: Respond to incoming messages with customizable logic.
- **HTTP Endpoints**: Send messages via HTTP requests to the server.
- **Scalability**: Supports multiple WhatsApp clients running concurrently.
- **Automatic Client Initialization**: Automatically initialize clients from saved UUIDs on server startup.

## Installation

### Local Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/wap-api-node.git
    cd wap-api-node
    ```

2. **Install dependencies**:
    - **Node version** >= 18.0.0
    ```bash
    npm install
    ```

3. **Create a .env file**:
    ```env
    PORT=3000
    CLIENTS_FILE_PATH=./clients.json
    ```

4. **Run the server**:
    ```bash
    yarn start
    ```

### Docker Installation

1. **Build the Docker image**:
    ```bash
    docker build -t wap-api .
    ```

2. **Run the Docker container**:
    ```bash
    docker run -d -p 3000:3000 --name wap-api wap-api
    ```

## Project Structure

```
wap-api-node
│
├── src
│   ├── api.js
│   ├── service.js
│
├── index.js
├── package.json
├── clients.json
├── Dockerfile
├── README.md
├── .env
```

## Endpoints

### Register a New Client

- **URL**: `/register`
- **Method**: `GET`
- **Description**: Registers a new WhatsApp client and returns its UUID along with the QR code.

**Response**:
```json
{
    "success": true,
    "clientId": "generated-uuid",
    "qrCode": "qr-code-string-in-base64"
}
```

### Send a Message

- **URL**: `/sendMessage`
- **Method**: `POST`
- **Description**: Sends a message from a specified client.

**Request Body**:
```json
{
    "numero": "recipient-phone-number",
    "mensagem": "message-to-send",
    "clientId": "client-uuid"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Mensagem enviada com sucesso"
}
```

### Get QR Code

- **URL**: `/getQRCode/:uuid`
- **Method**: `GET`
- **Description**: Retrieves the QR code for the client with the specified UUID.

**Response**:
```json
{
    "success": true,
    "qrCode": "qr-code-string-in-base64"
}
```

### Disconnect Client

- **URL**: `/disconnect/:uuid`
- **Method**: `DELETE`
- **Description**: Disconnects the client with the specified UUID.

**Response**:
```json
{
    "success": true,
    "message": "Cliente {uuid} desconectado com sucesso"
}
```

## Configuration

- **`PORT`**: The port on which the Express server runs. Default is `3000`.
- **`CLIENTS_FILE_PATH`**: Path to the JSON file that stores client UUIDs. Default is `./clients.json`.

## Example Usage

1. **Register a new client**:
    ```bash
    curl -X GET http://localhost:3000/register
    ```

2. **Get QR Code**:
    ```bash
    curl -X GET http://localhost:3000/getQRCode/{client-uuid}
    ```

3. **Send a message**:
    ```bash
    curl -X POST http://localhost:3000/sendMessage -H "Content-Type: application/json" -d '{"numero": "1234567890", "mensagem": "Olá, esta é uma mensagem enviada via HTTP!", "clientId": "client-uuid"}'
    ```

4. **Disconnect a client**:
    ```bash
    curl -X DELETE http://localhost:3000/disconnect/{client-uuid}
    ```

## Notes

- Ensure that the phone numbers include the country code without the `+` sign.
- The `clients.json` file should not be versioned; add it to your `.gitignore` file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.

## Acknowledgments

Special thanks to [pedroslopez](https://github.com/pedroslopez) for creating and maintaining the [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) library.