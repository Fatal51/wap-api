import "dotenv/config";
import app from "./api";

const PORT: string | number = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`);
});

export default server; // Export the server instance
