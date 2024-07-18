
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
    git clone https://github.com/fatal51/wap-api.git
    cd wap-api
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Run the server**:
    ```bash
    node api.js
    ```

### Docker Installation

1. **Build the Docker image**:
    ```bash
    docker build -t whatsapp-web-automation .
    ```

2. **Run the Docker container**:
    ```bash
    docker run -d -p 3000:3000 --name whatsapp-web-automation whatsapp-web-automation
    ```

## Endpoints

### Register a New Client

- **URL**: `/register`
- **Method**: `POST`
- **Description**: Registers a new WhatsApp client and returns its UUID.

**Response**:
```json
{
    "success": true,
    "clientId": "generated-uuid"
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

## Configuration

- **`PORT`**: The port on which the Express server runs. Default is `3000`.
- **`CLIENTS_FILE_PATH`**: Path to the JSON file that stores client UUIDs. Default is `./clients.json`.

## Example Usage

1. **Register a new client**:
    ```bash
    curl -X POST http://localhost:3000/register
    ```

2. **Send a message**:
    ```bash
    curl -X POST http://localhost:3000/sendMessage -H "Content-Type: application/json" -d '{"numero": "1234567890", "mensagem": "Olá, esta é uma mensagem enviada via HTTP!", "clientId": "client-uuid"}'
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
