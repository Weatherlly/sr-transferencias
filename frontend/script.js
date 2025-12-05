// Configurações
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
        transferList.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

// Função para converter o formato brasileiro
function converterDataHora(dataHoraString) {
    const [data, hora] = dataHoraString.split(' - ');
    const [dia, mes, ano] = data.split('/');
    const [h, m, s] = hora.split(':');
    
    return new Date(ano, mes - 1, dia, h, m, s);
}

// Exibir transferências em cards
function displayTransfers(transfers) {
    if (transfers.length === 0) {
        transferList.innerHTML = '<p class="no-transfers">Nenhuma transferência registrada ainda.</p>';
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
        `;
        
        card.addEventListener('click', () => openModal(transfer));
        transferList.appendChild(card);
    });
}

// Abrir modal com detalhes
function openModal(transfer) {
    try {
        // Formatação segura da data/hora
        const { date, time } = transfer.dataHora ? formatDate(transfer.dataHora) : { 
            date: '--/--/----', 
            time: '--:--:--' 
        };

        // Helper function para renderizar itens
        const renderItems = (items, isWeight = false) => {
            if (!items) return '<p>Nenhum item registrado</p>';
            
            const entries = Object.entries(items)
                .filter(([_, qtd]) => parseFloat(qtd) > 0)
                .map(([item, qtd]) => {
                    const itemName = item.split(' - ')[1] || item;
                    const unit = isWeight ? 'kg' : 'unidade(s)';
                    return `<p><strong>${itemName}:</strong> ${qtd} ${unit}</p>`;
                });
            
            return entries.length > 0 ? entries.join('') : '<p>Nenhum item transferido</p>';
        };

        modalBody.innerHTML = `
            <div class="modal-item">
                <h4><i class="far fa-calendar-alt"></i> Data e Hora</h4>
                <p>${date} às ${time}</p>
            </div>
            
            <div class="modal-item">
                <h4><i class="fas fa-exchange-alt"></i> Transferência</h4>
                <p><strong>Origem:</strong> ${transfer.lojaOrigem || 'Não informada'}</p>
                <p><strong>Destino:</strong> ${transfer.lojaDestino || 'Não informada'}</p>
            </div>
            
            <div class="modal-item">
                <h4><i class="fas fa-pizza-slice"></i> Pizzas</h4>
                ${renderItems(transfer.itensQuantidade)}
            </div>
            
            <div class="modal-item">
                <h4><i class="fas fa-utensils"></i> Sopas e Caldos</h4>
                ${renderItems(transfer.itensPeso, true)}
            </div>
        `;
        
        detailsModal.style.display = 'flex';
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        modalBody.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Não foi possível carregar os detalhes desta transferência</p>
            </div>
        `;
        detailsModal.style.display = 'flex';
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