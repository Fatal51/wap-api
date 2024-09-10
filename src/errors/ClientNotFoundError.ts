export class ClientNotFoundError extends Error {
  constructor(clientId: string) {
    super(`Client ${clientId} not found`);
    this.name = 'ClientNotFoundError';
  }
}
