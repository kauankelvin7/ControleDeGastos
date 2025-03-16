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
            console.log(error);
            alert('Erro ao recuperar transações.');
        })
}

// Função para adicionar as transações na tela
function addTransactionsToScreen(transactions) {
    const orderedList = document.getElementById('transactions');  // Obtém a referência da lista no HTML

    // Caso não haja transações, exibe uma mensagem informando
    if (transactions.length === 0) {
        orderedList.innerHTML = "<p>Você não tem transações registradas.</p>";
        return;
    }

    // Para cada transação, cria um item na lista e adiciona as informações
    transactions.forEach(transaction => {
        const li = document.createElement('li');
        li.classList.add(transaction.type); 
        li.id = transaction.uid;
        li.addEventListener('click', () => {
            window.location.href = "../transaction/transaction.html?uid=" + transaction.uid;
        })

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = "Remover";
        deleteButton.classList.add('remove-button');
        deleteButton.addEventListener('click', event => {
            event.stopPropagation();
            askRemoveTransaction(transaction);
        })
        li.appendChild(deleteButton);


        const date = document.createElement('p');
        date.innerHTML = formatDate(transaction.date);  // Formata a data da transação
        li.appendChild(date);

        const money = document.createElement('p');
        money.innerHTML = formatMoney(transaction.money);  // Formata o valor da transação
        li.appendChild(money);
        
        const type = document.createElement('p');
        type.innerHTML = transaction.transactionType;  // Adiciona o tipo de transação
        li.appendChild(type);

        if (transaction.description) {
            const description = document.createElement('p');
            description.innerHTML = transaction.description;  // Adiciona a descrição da transação, se houver
            li.appendChild(description);
        }

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
            document.getElementById(transaction.uid).remove();
        })
        .catch(error => {
            hideLoading();
            console.log(error);
            alert('Erro ao remover transação.');
        })
}

// Função para formatar a data da transação
function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-br');  // Formata a data no formato brasileiro
}

// Função para formatar o valor da transação
function formatMoney(money) {
    return `${money.currency} ${money.value.toFixed(2)}`;  // Formata o valor com duas casas decimais
}
