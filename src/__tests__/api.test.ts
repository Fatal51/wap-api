import request from "supertest";
import server from "../index"; // Import the server instance

jest.mock("whatsapp-web.js", () => {
  const clients = {};

  const Client = jest.fn(() => ({
    on: jest.fn((event, callback) => {
      if (event === "qr") {
        callback("fake-qr-code");
      }
      if (event === "ready") {
        callback();
      }
    }),
    sendMessage: jest.fn().mockResolvedValue(true),
    initialize: jest.fn(),
    destroy: jest.fn(),
  }));

  const LocalAuth = jest.fn(() => ({
    clientId: "test-client-id",
  }));

  return { Client, LocalAuth, clients };
});

describe("API Endpoints", () => {
  let mockUuid: string;

  beforeAll(async () => {
    // Register a new client to get a valid UUID for use in the tests
    const response = await request(server).get("/register");
    mockUuid = response.body.clientId; // Capture the clientId from the register response
  });

  afterAll((done) => {
    server.close(done); // Close the server to avoid open TCP connections
  });

  it("should register a new client and return QR code", async () => {
    const response = await request(server).get("/register");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.clientId).toBeDefined();
    expect(response.body.qrCode).toBeDefined();
  });

  it("should return all registered clients", async () => {
    const response = await request(server).get("/clients");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should send a message from a client", async () => {
    const response = await request(server).post("/sendMessage").send({
      numero: "1234567890",
      mensagem: "Hello, this is a test message",
      clientId: mockUuid, // Use the UUID from the register endpoint
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Mensagem enviada com sucesso");
  });

  it("should return the QR code for a given UUID", async () => {
    const response = await request(server).get(`/getQRCode/${mockUuid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.qrCode).toBeDefined();
  });

  it("should disconnect the client with the given UUID", async () => {
    const response = await request(server).delete(`/disconnect/${mockUuid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      `Cliente ${mockUuid} desconectado com sucesso`
    );
  });
});
