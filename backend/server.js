const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'transferencias');

// Configurações
app.use(cors());
app.use(express.json());

// Criar diretório se não existir
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Rota para salvar transferência
app.post('/api/transferencias', (req, res) => {
    try {
        const data = req.body;
        const fileName = `transferencia_${Date.now()}.json`;
        const filePath = path.join(DATA_DIR, fileName);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        res.status(201).json({ success: true, message: 'Transferência salva com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao salvar transferência', error: error.message });
    }
});

// Rota para listar transferências
app.get('/api/transferencias', (req, res) => {
    try {
        const files = fs.readdirSync(DATA_DIR);
        const transferencias = files.map(file => {
            const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
            return JSON.parse(content);
        });
        res.json(transferencias);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao ler transferências', error: error.message });
    }
});

// Servir frontend (opcional)
app.use(express.static(path.join(__dirname, '../frontend')));

// Iniciar servidor
app.listen(PORT, 'localhost', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Acessível na rede em http://localhost:${PORT}`);
});