import request from 'supertest';

import server from '../index';

jest.mock('whatsapp-web.js', () => {
  const Client = jest.fn(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'qr') {
        callback('fake-qr-code');
      }
      if (event === 'ready') {
        callback();
      }
    }),
    sendMessage: jest.fn().mockResolvedValue(true),
    initialize: jest.fn(),
    destroy: jest.fn(),
  }));

  const LocalAuth = jest.fn(() => ({
    clientId: 'test-client-id',
  }));

  const MessageMedia = {
    fromUrl: jest.fn().mockResolvedValue({
      mimetype: 'image/jpeg',
      data: 'mocked-data',
      filename: 'media.jpg',
    }),
  };

  return { Client, LocalAuth, MessageMedia };
});

// Mock the logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('API Endpoints', () => {
  let mockUuid: string;

  beforeAll(async () => {
    // Register a new client to get a valid UUID for use in the tests
    const response = await request(server).get('/register');
    mockUuid = response.body.clientId; // Capture the clientId from the register response
  });

  afterAll((done) => {
    server.close(done); // Close the server to avoid open TCP connections
  });

  it('should register a new client and return QR code', async () => {
    const response = await request(server).get('/register');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.clientId).toBeDefined();
    expect(response.body.qrCode).toBeDefined();
  });

  it('should return all registered clients', async () => {
    const response = await request(server).get('/clients');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should send a message from a client', async () => {
    const response = await request(server).post('/sendMessage').send({
      numero: '1234567890',
      mensagem: 'Hello, this is a test message',
      clientId: mockUuid, // Use the UUID from the register endpoint
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Mensagem enviada com sucesso');
  });

  it('should return the QR code for a given UUID', async () => {
    const response = await request(server).get(`/getQRCode/${mockUuid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.qrCode).toBeDefined();
  });

  it('should send a image from a url to the given number', async () => {
    const response = await request(server).post('/sendMedia').send({
      numero: '1234567890',
      mediaUrl:
        'https://fastly.picsum.photos/id/379/200/300.jpg?hmac=IEcRQyv-DIaRsldE8jIdMRW5IHCTyemefU-bbCJpY34',
      clientId: mockUuid, // Use the UUID from the register endpoint
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Media sent successfully');
  });

  it('should add a callback URL to the client', async () => {
    const response = await request(server).post('/addCallbackUrl').send({
      clientId: mockUuid,
      callbackURL: 'http://localhost:3000/callback',
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Callback URL added successfully');
  });

  // This should be the last test in the file as it disconnects the client
  it('should disconnect the client with the given UUID', async () => {
    const response = await request(server).delete(`/disconnect/${mockUuid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      `Cliente ${mockUuid} desconectado com sucesso`,
    );
  });
});
