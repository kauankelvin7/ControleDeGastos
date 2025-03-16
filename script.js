let emailValid = false;
let passwordValid = false;

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        window.location.href = "pages/home/home.html";
    }
}) 

function checkBrowserSupport() {
    if (!window.localStorage) {
        console.warn('LocalStorage não suportado');
    }
    if (!window.fetch) {
        console.warn('Fetch API não suportada');
    }
}

class DOMManager {
    static elements = {
        email: () => document.getElementById("email"),
        password: () => document.getElementById("password"),
        emailError: () => document.getElementById("email-error"),
        passwordError: () => document.getElementById("password-error"),
        loginButton: () => document.getElementById("login-button"),
        recoverButton: () => document.getElementById("recover-password-button")
    };

    static updateElement(id, value) {
        if (this.elements[id]) {
            this.elements[id].value = value;
        }
    }
}

const DOM = {
    email: () => document.getElementById("email"),
    password: () => document.getElementById("password"),
    emailError: () => document.getElementById("email-error"),
    passwordError: () => document.getElementById("password-error"),
    loginButton: () => document.getElementById("login-button"),
    recoverButton: () => document.getElementById("recover-password-button")
};

function onChangeEmail() {
    const email = DOM.email().value.trim();
    emailValid = validateEmail(email);

    DOM.emailError().style.display = emailValid ? "none" : "block";
    DOM.recoverButton().disabled = !emailValid;
    updateLoginButtonState();
}

function onChangePassword() {
    const password = DOM.password().value;
    passwordValid = isPasswordValid(password);

    DOM.passwordError().style.display = passwordValid ? "none" : "block";
    updateLoginButtonState();
}

function showLoadingWithTimeout(timeout = 10000) {
    showLoading();
    setTimeout(() => {
        if (document.querySelector('.loading')) {
            hideLoading();
            showToast('Tempo limite excedido. Tente novamente.');
        }
    }, timeout);
}

function updateLoginButtonState() {
    DOM.loginButton().disabled = !(emailValid && passwordValid);
}

async function login() {
    try {
        showLoading(); 
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!emailValid || !passwordValid) {
            hideLoading();
            alert("Por favor, preencha todos os campos corretamente.");
            return;
        }

        await firebase.auth().signInWithEmailAndPassword(email, password);
        hideLoading();
        window.location.href = "pages/home/home.html"; 
    } catch (error) {
        hideLoading();
        
        if (error.code === "auth/invalid-credential") {
            alert("As credenciais fornecidas são inválidas. Por favor, tente novamente.");
        } else if (error.code === "auth/user-not-found") {
            alert("Usuário não encontrado.");
        } else if (error.code === "auth/wrong-password") {
            alert("Senha incorreta.");
        } else {
            alert("Erro desconhecido: " + error.message); 
        }
    }
}

function recoverPassword() {
    const email = DOM.email().value.trim();

    // Validação do email
    if (!validateEmail(email)) {
        alert("Por favor, insira um email válido.");
        return;
    }

    showLoading();

    // Retornando uma Promise
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            hideLoading();
            showToast("Email de recuperação enviado com sucesso!", "success");
        })
        .catch((error) => {
            hideLoading();
            console.error("Erro no Firebase:", error);

            // Trata os erros conhecidos
            if (error.code === "auth/invalid-email") {
                alert("Email inválido. Verifique e tente novamente.");
            } else if (error.code === "auth/user-not-found") {
                alert("Email não registrado. Por favor, insira um email cadastrado.");
            } else {
                alert("Erro desconhecido: " + error.message);
            }
        });
}



function getErrorMessage(error) {
    const errorMessages = {
        "auth/user-not-found": "Usuário não encontrado",
        "auth/wrong-password": "Senha incorreta",
        "auth/invalid-email": "Email inválido",
        "auth/user-disabled": "Usuário desativado",
        "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
        "auth/network-request-failed": "Erro de conexão. Verifique sua internet"
    };

    return errorMessages[error.code] || error.message;
}

function register() {
    showLoading();
    window.location.href = "pages/register/register.html";
}

DOM.loginButton().addEventListener('click', debounce(login, 1000));

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    
    return {
        isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
        errors: {
            minLength,
            hasUpper,
            hasLower,
            hasNumber,
            hasSpecial
        }
    };
}

function rememberUser(email) {
    localStorage.setItem('rememberedEmail', email);
}

function checkRememberedUser() {
    const email = localStorage.getItem('rememberedEmail');
    if (email) {
        DOMManager.elements.email.value = email;
        onChangeEmail();
    }
}
