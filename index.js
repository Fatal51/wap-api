require('dotenv').config();
const app = require('./src/api');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor HTTP rodando na porta ${PORT}`);
});
