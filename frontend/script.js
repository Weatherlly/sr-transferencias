// Configurações - USA O IP DA AWS
const API_URL = "http://18.212.217.221:3000/api";
const transferList = document.getElementById('transferList');
const detailsModal = document.getElementById('detailsModal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close-btn');

// Formatar data
function formatDate(dateString) {
    if (!dateString || !dateString.includes(' - ')) {
        return { date: '--/--/----', time: '--:--:--' };
    }
    const [datePart, timePart] = dateString.split(' - ');
    return { date: datePart, time: timePart };
}

// Carregar transferências
async function loadTransfers() {
    try {
        // Mostrar estado de carregamento
        transferList.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="spinner"></div>
                <p>Carregando transferências...</p>
            </div>
        `;
        
        const response = await fetch(`${API_URL}/transferencias`);
        if (!response.ok) throw new Error('Erro ao carregar transferências');
        
        const transfers = await response.json();
        
        // Ordenar do mais recente para o mais antigo
        const transfersOrdenadas = transfers.sort((a, b) => {
            const dataB = converterDataHora(b.dataHora);
            const dataA = converterDataHora(a.dataHora);
            return dataB - dataA;
        });
        
        displayTransfers(transfersOrdenadas);
    } catch (error) {
        console.error('Erro:', error);
        transferList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${error.message}</p>
                <button onclick="loadTransfers()" style="margin-top: 10px;">
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// Função para converter o formato brasileiro
function converterDataHora(dataHoraString) {
    if (!dataHoraString || !dataHoraString.includes(' - ')) {
        return new Date(0);
    }
    
    const [data, hora] = dataHoraString.split(' - ');
    const [dia, mes, ano] = data.split('/');
    const [h, m, s] = hora.split(':');
    
    return new Date(ano, mes - 1, dia, h, m, s);
}

// Exibir transferências em cards
function displayTransfers(transfers) {
    if (!transfers || transfers.length === 0) {
        transferList.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-inbox" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <h3>Nenhuma transferência registrada ainda.</h3>
                <p>Clique em "Nova Transferência" para começar.</p>
            </div>
        `;
        return;
    }

    transferList.innerHTML = '';
    
    transfers.forEach(transfer => {
        const { date, time } = formatDate(transfer.dataHora);
        
        const card = document.createElement('div');
        card.className = 'transfer-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-date">${date}</span>
                <span class="card-time">${time}</span>
            </div>
            <div class="card-lojas">
                <div><i class="fas fa-store"></i> <strong>Origem:</strong> ${transfer.lojaOrigem}</div>
                <div><i class="fas fa-truck"></i> <strong>Destino:</strong> ${transfer.lojaDestino}</div>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                <i class="fas fa-pizza-slice"></i> Pizzas: ${Object.keys(transfer.itensQuantidade || {}).length} |
                <i class="fas fa-utensils"></i> Sopas: ${Object.keys(transfer.itensPeso || {}).length}
            </div>
        `;
        
        card.addEventListener('click', () => openModal(transfer));
        transferList.appendChild(card);
    });
}

// Abrir modal com detalhes
function openModal(transfer) {
    try {
        const { date, time } = formatDate(transfer.dataHora);

        // Helper function para renderizar itens
        const renderItems = (items, isWeight = false) => {
            if (!items) return '<p style="color: #666; font-style: italic;">Nenhum item registrado</p>';
            
            const entries = Object.entries(items)
                .filter(([_, qtd]) => parseFloat(qtd) > 0)
                .map(([item, qtd]) => {
                    const itemName = item.split(' - ')[1] || item;
                    const unit = isWeight ? 'kg' : 'unidade(s)';
                    return `<p style="margin: 5px 0;"><strong>${itemName}:</strong> ${qtd} ${unit}</p>`;
                });
            
            return entries.length > 0 ? entries.join('') : '<p style="color: #666; font-style: italic;">Nenhum item transferido</p>';
        };

        modalBody.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 5px;"><i class="far fa-calendar-alt"></i> Data e Hora</h4>
                <p>${date} às ${time}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 5px;"><i class="fas fa-exchange-alt"></i> Transferência</h4>
                <p><strong>Origem:</strong> ${transfer.lojaOrigem || 'Não informada'}</p>
                <p><strong>Destino:</strong> ${transfer.lojaDestino || 'Não informada'}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 5px;"><i class="fas fa-pizza-slice"></i> Pizzas</h4>
                ${renderItems(transfer.itensQuantidade)}
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 5px;"><i class="fas fa-utensils"></i> Sopas e Caldos</h4>
                ${renderItems(transfer.itensPeso, true)}
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
                <button onclick="deleteTransfer(${transfer.id}, '${transfer.lojaOrigem} → ${transfer.lojaDestino}')" 
                        style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Excluir Transferência
                </button>
            </div>
        `;
        
        detailsModal.style.display = 'flex';
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12;"></i>
                <p>Não foi possível carregar os detalhes desta transferência</p>
            </div>
        `;
        detailsModal.style.display = 'flex';
    }
}

// Função para excluir transferência
async function deleteTransfer(id, description) {
    if (!confirm(`Tem certeza que deseja excluir a transferência?\n${description}`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/transferencias/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Transferência excluída com sucesso!');
            loadTransfers(); // Recarregar lista
            detailsModal.style.display = 'none'; // Fechar modal
        } else {
            alert('❌ Erro ao excluir: ' + (result.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('❌ Erro de conexão ao excluir transferência');
    }
}

// Fechar modal
closeBtn.addEventListener('click', () => {
    detailsModal.style.display = 'none';
});

// Fechar ao clicar fora do modal
window.addEventListener('click', (e) => {
    if (e.target === detailsModal) {
        detailsModal.style.display = 'none';
    }
});

// Carregar dados quando a página abrir
document.addEventListener('DOMContentLoaded', loadTransfers);

// Atualizar automaticamente a cada 30 segundos
setInterval(loadTransfers, 30000);