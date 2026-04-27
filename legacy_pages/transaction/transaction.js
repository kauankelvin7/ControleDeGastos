function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "../../index.html";  
    }).catch(() => {
        showToast('Erro ao fazer logout.', 'error');
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
        showToast("Você precisa estar logado para salvar a transação.", "warning");
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
            showToast("Transação salva com sucesso!", "success");
            setTimeout(() => {
                window.location.href = "../home/home.html"; // Redirecionar para a página inicial
            }, 500); // Pequeno atraso para o usuário ver o toast
        })
        .catch(() => {
            hideLoading();
            showToast('Erro ao salvar transação.', 'error');
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
            showToast("Transação atualizada com sucesso!", "success");
            setTimeout(() => {
                window.location.href = "../home/home.html"; // Redirecionar para a página inicial
            }, 500);
        })
        .catch(() => {
            hideLoading();
            showToast('Erro ao atualizar transação.', 'error');
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
                showToast("Documento não encontrado.", "warning");
                setTimeout(() => {
                    window.location.href = "../home/home.html";
                }, 1000);
            }
        })
        .catch(() => {
            hideLoading();
            showToast("Erro ao recuperar documento", "error");
            setTimeout(() => {
                window.location.href = "../home/home.html";
            }, 1000);
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
    
    // Forçar a validação visual (bordas verdes) nos campos preenchidos
    onChangeDate();
    onChangeCurrency();
    onChangeValue();
    onChangeTransactionType();
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
    const dateInput = form.date();
    const hasValue = !!dateInput.value;
    
    form.dateRequiredError().style.display = !hasValue ? "block" : "none";
    
    if (!hasValue) {
        dateInput.classList.add("input--error");
        dateInput.classList.remove("input--success");
    } else {
        dateInput.classList.remove("input--error");
        dateInput.classList.add("input--success");
    }
    
    validateForm(); // Valida o formulário completo
}

function onChangeCurrency() {
    const currencyInput = form.currency();
    const hasValue = !!currencyInput.value;
    
    form.currencyRequiredError().style.display = !hasValue ? "block" : "none";
    
    if (!hasValue) {
        currencyInput.classList.add("input--error");
        currencyInput.classList.remove("input--success");
    } else {
        currencyInput.classList.remove("input--error");
        currencyInput.classList.add("input--success");
    }
    
    validateForm();
}

function onChangeValue() {
    const valueInput = form.value();
    const value = parseFloat(valueInput.value);
    const isValid = value && value > 0;
    
    form.valueRequiredError().style.display = !isValid ? "block" : "none";
    
    if (!isValid) {
        valueInput.classList.add("input--error");
        valueInput.classList.remove("input--success");
    } else {
        valueInput.classList.remove("input--error");
        valueInput.classList.add("input--success");
    }
    
    validateForm();
}

function onChangeTransactionType() {
    const transactionInput = form.transactionType();
    const hasValue = !!transactionInput.value;
    
    form.transactionRequiredError().style.display = !hasValue ? "block" : "none";
    
    if (!hasValue) {
        transactionInput.classList.add("input--error");
        transactionInput.classList.remove("input--success");
    } else {
        transactionInput.classList.remove("input--error");
        transactionInput.classList.add("input--success");
    }
    
    validateForm();
}

function validateForm() {
    const date = form.date().value;
    const currency = form.currency().value;
    const value = parseFloat(form.value().value);
    const transactionType = form.transactionType().value;

    form.saveButton().disabled = !(date && currency && value > 0 && transactionType);
}

// Utilitário de Toast (Notificação visual)
function showToast(message, type = "info") {
    console.log(type + ": " + message);
    
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add("toast--visible");
        });
    });
    
    setTimeout(() => {
        toast.classList.remove("toast--visible");
        toast.addEventListener("transitionend", () => toast.remove());
    }, 3500);
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