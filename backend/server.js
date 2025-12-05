require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();

// Configurações do .env
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_IP = process.env.PUBLIC_IP || '18.212.217.221';

// Diretório para transferências
const TRANSFERENCIAS_DIR = path.join(__dirname, 'transferencias');

// Configurações do Express
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Criar diretório se não existir
async function ensureTransferenciasDir() {
    try {
        await fs.access(TRANSFERENCIAS_DIR);
    } catch (error) {
        await fs.mkdir(TRANSFERENCIAS_DIR, { recursive: true });
        console.log(`📁 Pasta ${TRANSFERENCIAS_DIR} criada`);
    }
}

// ============================================
// ROTAS DO SUPER RAIMUNDINHO (Transferências)
// ============================================

// Rota para salvar transferência
app.post('/api/transferencias', async (req, res) => {
    try {
        await ensureTransferenciasDir();
        const data = req.body;
        
        // Validar dados obrigatórios
        if (!data.lojaOrigem || !data.lojaDestino) {
            return res.status(400).json({ 
                success: false, 
                message: 'Loja de origem e destino são obrigatórias!' 
            });
        }
        
        // Validar lojas diferentes
        if (data.lojaOrigem === data.lojaDestino) {
            return res.status(400).json({ 
                success: false, 
                message: 'A loja de origem e destino não podem ser iguais!' 
            });
        }

        // Criar nome único para o arquivo
        const fileName = `transferencia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
        const filePath = path.join(TRANSFERENCIAS_DIR, fileName);

        // Adicionar timestamp de criação
        data.criadoEm = new Date().toISOString();
        data.id = Date.now();

        // Salvar no arquivo
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        
        console.log(`✅ Transferência salva: ${fileName}`);
        res.status(201).json({ 
            success: true, 
            message: 'Transferência registrada com sucesso!',
            id: data.id
        });
        
    } catch (error) {
        console.error('❌ Erro ao salvar transferência:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao salvar transferência no servidor' 
        });
    }
});

// Rota para listar transferências
app.get('/api/transferencias', async (req, res) => {
    try {
        await ensureTransferenciasDir();
        const files = await fs.readdir(TRANSFERENCIAS_DIR);
        const transferencias = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const content = await fs.readFile(path.join(TRANSFERENCIAS_DIR, file), 'utf8');
                    const transferencia = JSON.parse(content);
                    transferencias.push(transferencia);
                } catch (error) {
                    console.warn(`⚠️  Erro ao ler arquivo ${file}:`, error.message);
                }
            }
        }
        
        console.log(`📊 ${transferencias.length} transferências encontradas`);
        res.json(transferencias);
        
    } catch (error) {
        console.error('❌ Erro ao ler transferências:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao carregar transferências' 
        });
    }
});

// Rota para deletar transferência
app.delete('/api/transferencias/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await ensureTransferenciasDir();
        const files = await fs.readdir(TRANSFERENCIAS_DIR);
        
        let deletado = false;
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(TRANSFERENCIAS_DIR, file), 'utf8');
                const transferencia = JSON.parse(content);
                
                if (transferencia.id === id) {
                    await fs.unlink(path.join(TRANSFERENCIAS_DIR, file));
                    deletado = true;
                    console.log(`🗑️  Transferência ${id} deletada`);
                    break;
                }
            }
        }
        
        if (deletado) {
            res.json({ success: true, message: 'Transferência deletada com sucesso!' });
        } else {
            res.status(404).json({ success: false, message: 'Transferência não encontrada' });
        }
        
    } catch (error) {
        console.error('❌ Erro ao deletar transferência:', error);
        res.status(500).json({ success: false, message: 'Erro ao deletar transferência' });
    }
});

// ============================================
// ROTAS AUXILIARES
// ============================================

// Rota de teste/status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        timestamp: new Date().toISOString(),
        port: PORT,
        system: 'Super Raimundinho - Transferências'
    });
});

// Rota raiz - página inicial
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Super Raimundinho - Transferências</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2c3e50; }
                .links { margin: 20px 0; }
                .links a { display: block; margin: 10px 0; padding: 10px; 
                          background: #3498db; color: white; text-decoration: none; 
                          border-radius: 5px; }
                .links a:hover { background: #2980b9; }
                .info { background: #f8f9fa; padding: 15px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>Super Raimundinho - Sistema de Transferências</h1>
            <div class="info">
                <p><strong>Servidor rodando na porta:</strong> ${PORT}</p>
                <p><strong>IP Público:</strong> ${PUBLIC_IP}</p>
            </div>
            <div class="links">
                <a href="/registrar.html">📝 Registrar Nova Transferência</a>
                <a href="/index.html">📋 Listar Transferências</a>
                <a href="/api/transferencias">🔧 API de Transferências (JSON)</a>
                <a href="/api/status">📊 Status do Servidor</a>
            </div>
        </body>
        </html>
    `);
});

// ============================================
// MANIPULAÇÃO DE ERROS
// ============================================

// Rota não encontrada
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada',
        available: ['/', '/registrar.html', '/index.html', '/api/transferencias', '/api/status']
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, HOST, () => {
    console.log('='.repeat(60));
    console.log('🚀 SUPER RAIMUNDINHO - SISTEMA DE TRANSFERÊNCIAS');
    console.log('='.repeat(60));
    console.log(`✅ Servidor iniciado com sucesso!`);
    console.log(`📡 Ouvindo em: ${HOST}:${PORT}`);
    console.log(`🌐 Acesso externo: http://${PUBLIC_IP}:${PORT}`);
    console.log('='.repeat(60));
    console.log('🔗 URLs disponíveis:');
    console.log(`   📝 Registrar: http://${PUBLIC_IP}:${PORT}/registrar.html`);
    console.log(`   📋 Listar:    http://${PUBLIC_IP}:${PORT}/index.html`);
    console.log(`   📊 Status:    http://${PUBLIC_IP}:${PORT}/api/status`);
    console.log('='.repeat(60));
});