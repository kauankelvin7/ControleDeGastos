// Função de logout
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "../../index.html";  // Redireciona para a página de login
    }).catch(() => {
        alert('Erro ao fazer logout.');
    });
}

// Escuta a mudança de estado de autenticação do usuário
firebase.auth().onAuthStateChanged(user => {
    if (user) { 
        // Se o usuário estiver autenticado, chama a função para buscar as transações
        findTransactions(user);
    } else {
        // Se o usuário não estiver logado, redireciona para a página de login
        window.location.href = "../../index.html";
    }
});

// Função chamada quando o botão de nova transação é clicado
function newTransaction() {
    window.location.href = "../transaction/transaction.html";  // Redireciona para a página de nova transação
}

// Função para buscar as transações do usuário
function findTransactions(user) {
    showLoading();  // Mostra o loading enquanto busca as transações
    firebase.firestore()
        .collection('transactions')  // Nome da coleção deve ser 'transactions'
        .where('user.uid', '==', user.uid)  // Filtra as transações do usuário logado
        .orderBy('date', 'desc')  // Ordena as transações por data, do mais recente para o mais antigo
        .get()
        .then(snapshot => {
            hideLoading();  // Esconde o loading após carregar os dados
            const transactions = snapshot.docs.map(doc => ({
                ...doc.data(),
                uid: doc.id
            }));
            addTransactionsToScreen(transactions);  // Chama a função para adicionar as transações na tela
        })
        .catch(error => {
            hideLoading();  // Esconde o loading em caso de erro
            console.error(error);
            alert('Erro ao recuperar transações.');
        });
}

// Função para adicionar as transações na tela
function addTransactionsToScreen(transactions) {
    const orderedList = document.getElementById('transactions');  // Obtém a referência da lista no HTML
    orderedList.innerHTML = ""; // Limpa a lista antes de renderizar para evitar duplicações

    // Caso não haja transações, exibe uma mensagem informando
    if (transactions.length === 0) {
        orderedList.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Você não tem transações registradas.</p>
            </div>
        `;
        return;
    }

    // Para cada transação, cria um item na lista e adiciona as informações
    transactions.forEach(transaction => {
        const li = document.createElement('li');
        li.classList.add(transaction.type); 
        li.id = transaction.uid;
        li.addEventListener('click', () => {
            window.location.href = `../transaction/transaction.html?uid=${transaction.uid}`;
        });

        // Bloco Esquerdo: Agrupa as informações de texto
        const infoContainer = document.createElement('div');
        infoContainer.style.display = 'flex';
        infoContainer.style.flexDirection = 'column';
        infoContainer.style.gap = '2px';

        const date = document.createElement('p');
        date.style.color = 'var(--text-muted)';
        date.style.fontSize = 'var(--text-xs)';
        date.style.margin = '0';
        date.innerHTML = formatDate(transaction.date);  // Formata a data da transação
        infoContainer.appendChild(date);

        const type = document.createElement('p');
        type.style.fontWeight = '600';
        type.style.color = 'var(--text-primary)';
        type.style.margin = '0';
        type.innerHTML = transaction.transactionType;  // Adiciona o tipo de transação
        infoContainer.appendChild(type);

        if (transaction.description) {
            const description = document.createElement('p');
            description.style.fontSize = 'var(--text-sm)';
            description.style.color = 'var(--text-secondary)';
            description.style.margin = '2px 0 0 0';
            description.innerHTML = transaction.description;  // Adiciona a descrição da transação, se houver
            infoContainer.appendChild(description);
        }

        // Bloco Direito: Agrupa o valor e o botão de remover
        const moneyContainer = document.createElement('div');
        moneyContainer.style.display = 'flex';
        moneyContainer.style.alignItems = 'center';
        moneyContainer.style.gap = 'var(--space-4)';

        const money = document.createElement('p');
        money.style.fontFamily = 'var(--font-mono)';
        money.style.fontWeight = '700';
        money.style.fontSize = 'var(--text-base)';
        money.style.margin = '0';
        money.style.color = transaction.type === 'expense' ? 'var(--danger)' : 'var(--success)';
        money.innerHTML = formatMoney(transaction.money);  // Formata o valor da transação
        moneyContainer.appendChild(money);

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = "Remover";
        deleteButton.classList.add('remove-button');
        deleteButton.addEventListener('click', event => {
            event.stopPropagation();
            askRemoveTransaction(transaction);
        });
        moneyContainer.appendChild(deleteButton);

        li.appendChild(infoContainer);
        li.appendChild(moneyContainer);

        orderedList.appendChild(li);  // Adiciona o item à lista
    });
}

function askRemoveTransaction(transaction) {
    const shouldRemove = confirm('Deseja remover a transação?');
    if(shouldRemove) {
        removeTransaction(transaction);
    }
}

function removeTransaction(transaction) {
    showLoading();

    firebase.firestore()
        .collection("transactions")
        .doc(transaction.uid)
        .delete()
        .then(() => {
            hideLoading();
            const itemToRemove = document.getElementById(transaction.uid);
            if (itemToRemove) itemToRemove.remove();
            
            // Verifica se a lista ficou vazia após a remoção para renderizar o Empty State
            const orderedList = document.getElementById('transactions');
            if (orderedList.children.length === 0) {
                 orderedList.innerHTML = `
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p>Você não tem transações registradas.</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            hideLoading();
            console.log(error);
            alert('Erro ao remover transação.');
        });
}

// Função para formatar a data da transação
function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-br');  // Formata a data no formato brasileiro
}

// Função para formatar o valor da transação
function formatMoney(money) {
    // Melhorado para exibir os valores nos padrões nativos monetários pt-BR
    return `${money.currency} ${money.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;  // Formata o valor com duas casas decimais
}