function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "../../index.html";  
    }).catch(() => {
        alert('Erro ao fazer logout.');
    });
}

function back() {
        window.location.href = "../home/home.html"; 
}

function saveTransaction() {
    showLoading();

    // Verificar se o usuário está autenticado antes de continuar
    const user = firebase.auth().currentUser;
    if (!user) {
        hideLoading();
        alert("Você precisa estar logado para salvar a transação.");
        return;
    }

    const transaction = createTransaction(user.uid);

    if (isNewTransaction()) {
        save(transaction);
    } else {
        update(transaction);
    }
}

function save(transaction) {
    firebase.firestore()
        .collection('transactions')
        .add(transaction)
        .then(() => {
            hideLoading();
            window.location.href = "../home/home.html"; // Redirecionar para a página inicial
        })
        .catch(() => {
            hideLoading();
            alert('Erro ao salvar transação.');
        });
}

function update(transaction) {
    showLoading();
    firebase.firestore()
        .collection("transactions")
        .doc(getTransactionUid())
        .update(transaction)
        .then(() => {
            hideLoading();
            window.location.href = "../home/home.html"; // Redirecionar para a página inicial
        })
        .catch(() => {
            hideLoading();
            alert('Erro ao atualizar transação.');
        });
}

function toggleSaveButtonDisable() {
    const date = form.date().value;
    const currency = form.currency().value;
    const value = parseFloat(form.value().value);
    const transactionType = form.transactionType().value;

    form.saveButton().disabled = !(date && currency && value > 0 && transactionType);
}


function createTransaction(uid) {
    return {
        type: form.typeExpense().checked ? "expense" : "income",
        date: form.date().value,
        money: {
            currency: form.currency().value,
            value: parseFloat(form.value().value)
        },
        transactionType: mapTransactionType(form.transactionType().value),  // Mapeia para o português
        description: form.description().value,
        user: {
            uid: uid
        }
    };
}

function getTransactionUid() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid');
}

function isNewTransaction() {
    return !getTransactionUid();
}

function findTransactionByUid(uid) {
    showLoading();

    firebase.firestore()
        .collection("transactions")
        .doc(uid)
        .get()
        .then(doc => {
            hideLoading();
            if (doc.exists) {
              fillTransactionScreen(doc.data());
              toggleSaveButtonDisable();
            } else {
                alert("Documento não encontrado.");
                window.location.href = "../home/home.html";
            }
        })
        .catch(() => {
            hideLoading();
            alert("Erro ao recuperar documento");
            window.location.href = "../home/home.html";
        });
}

function fillTransactionScreen(transaction) {
    if (transaction.type == 'expense') {
        form.typeExpense().checked = true;
    } else {
        form.typeIncome().checked = true;
    }

    form.date().value = transaction.date;
    form.currency().value = transaction.money.currency;
    form.value().value = transaction.money.value;

    // Mapear o tipo de transação para português antes de definir o valor no formulário
    form.transactionType().value = mapTransactionType(transaction.transactionType);

    if (transaction.description) {
        form.description().value = transaction.description;
    }
}
if (!isNewTransaction()) {
    const uid = getTransactionUid();
    findTransactionByUid(uid);
}

// Função para mapear o tipo de transação para português
function mapTransactionType(type) {
    switch (type) {
        case "Acomodação":
            return "Acomodação";
        case "Alimentação":
            return "Alimentação";
        case "Transporte":
            return "Transporte";
        case "Salário":
            return "Salário";
        case "Supermercado":
            return "Supermercado";
        case "Outros":
            return "Outros";
        default:
            return "Outros";  // Valor padrão caso nenhum tipo seja selecionado
    }
}

// Funções de validação do formulário
function onChangeDate() {
    form.dateRequiredError().style.display = !form.date().value ? "block" : "none";
    validateForm(); // Valida o formulário completo
}

function onChangeCurrency() {
    form.currencyRequiredError().style.display = !form.currency().value ? "block" : "none";
    validateForm();
}

function onChangeValue() {
    const value = parseFloat(form.value().value);
    form.valueRequiredError().style.display = !value || value <= 0 ? "block" : "none";
    validateForm();
}

function onChangeTransactionType() {
    form.transactionRequiredError().style.display = !form.transactionType().value ? "block" : "none";
    validateForm();
}

function validateForm() {
    const date = form.date().value;
    const currency = form.currency().value;
    const value = parseFloat(form.value().value);
    const transactionType = form.transactionType().value;

    form.saveButton().disabled = !(date && currency && value > 0 && transactionType);
}

const form = {
    description: () => document.getElementById('description'),
    currency: () => document.getElementById('currency'),
    date: () => document.getElementById('date'),
    dateRequiredError: () => document.getElementById('data-error-message'),
    currencyRequiredError: () => document.getElementById('currency-error-message'),
    value: () => document.getElementById('value'),
    valueRequiredError: () => document.getElementById('value-error-message'),
    transactionType: () => document.getElementById('transaction-type'),
    typeExpense: () => document.getElementById('expense'),
    typeIncome: () => document.getElementById('income'),
    transactionRequiredError: () => document.getElementById('transaction-error-message'),
    saveButton: () => document.getElementById('save-button')
};
