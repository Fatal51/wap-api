import "dotenv/config";
import app from "./src/api";

const PORT: string | number = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`);
});
