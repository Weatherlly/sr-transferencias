const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'transferencias');
const IP = process.env.IP || '0.0.0.0';

// Configurações
app.use(cors({
    origin: '*',
    credentials: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Criar diretório se não existir (assíncrono)
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch (error) {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Rota para salvar transferência
app.post('/api/transferencias', async (req, res) => {
    try {
        await ensureDataDir();
        const data = req.body;
        const fileName = `transferencia_${Date.now()}.json`;
        const filePath = path.join(DATA_DIR, fileName);

        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        res.status(201).json({ success: true, message: 'Transferência salva com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar transferência:', error);
        res.status(500).json({ success: false, message: 'Erro ao salvar transferência', error: error.message });
    }
});

// Rota para listar transferências
app.get('/api/transferencias', async (req, res) => {
    try {
        await ensureDataDir();
        const files = await fs.readdir(DATA_DIR);
        const transferencias = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
                transferencias.push(JSON.parse(content));
            }
        }
        
        res.json(transferencias);
    } catch (error) {
        console.error('Erro ao ler transferências:', error);
        res.status(500).json({ success: false, message: 'Erro ao ler transferências', error: error.message });
    }
});

// Servir frontend (opcional)
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware de erro
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
    });
});

// Rota para página não encontrada
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Iniciar servidor
app.listen(PORT, IP, () => {
    console.log(`Servidor rodando em http://${IP}:${PORT}`);
});