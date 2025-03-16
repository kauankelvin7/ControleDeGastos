// Variáveis globais para o estado de validação dos campos
let emailValid = false;
let passwordValid = false;
let confirmPasswordValid = false;

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        window.location.href = "../home/home.html";
    }
}) 

// Função de logout
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "../../index.html";  // Redireciona para a página de login
    }).catch(() => {
        alert('Erro ao fazer logout.');
    });
}

// Elementos do formulário
const form = {
    email: () => document.getElementById("email"),
    password: () => document.getElementById("password"),
    confirmPassword: () => document.getElementById("confirmPassword"),
    emailError: () => document.getElementById("email-error"),
    passwordError: () => document.getElementById("password-error"),
    passwordDoesntMatchError: () => document.getElementById("password-doesnt-match-error"),
    registerButton: () => document.getElementById("register-button")
};

// Função de validação de email
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
}

// Função de validação de senha
function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}

// Função para verificar a validade do email
function onChangeEmail() {
    const email = form.email().value.trim();
    emailValid = validateEmail(email);

    // Mostrar/ocultar as mensagens de erro
    form.emailError().style.display = emailValid ? "none" : "block";

    // Atualizar o estado do botão de registro
    updateRegisterButtonState();
}

// Função para verificar a validade da senha
function onChangePassword() {
    const password = form.password().value;
    passwordValid = validatePassword(password);

    // Mostrar/ocultar as mensagens de erro
    form.passwordError().style.display = passwordValid ? "none" : "block";

    // Atualizar o estado do botão de registro
    updateRegisterButtonState();
}

// Função para verificar a confirmação da senha
function onChangeConfirmPassword() {
    const password = form.password().value;
    const confirmPassword = form.confirmPassword().value;
    confirmPasswordValid = (password === confirmPassword);

    // Mostrar/ocultar as mensagens de erro
    form.passwordDoesntMatchError().style.display = confirmPasswordValid ? "none" : "block";

    // Atualizar o estado do botão de registro
    updateRegisterButtonState();
}

// Função para atualizar o estado do botão de registro
function updateRegisterButtonState() {
    const registerButton = form.registerButton();
    registerButton.disabled = !(emailValid && passwordValid && confirmPasswordValid);
}

// Função de submit do formulário (registro)
async function register() {
    try {
        showLoading();

        const email = form.email().value.trim();
        const password = form.password().value;

        // Registro do usuário no Firebase
        await firebase.auth().createUserWithEmailAndPassword(email, password);

        hideLoading();
        showToast("Usuário registrado com sucesso!", "success");
        window.location.href = "/../../pages/home/home.html";
    } catch (error) {
        hideLoading();
        console.error("Erro no Firebase:", error);
        
        if (error.code === "auth/email-already-in-use") {
            alert("Este email já está em uso. Tente outro.");
        } else if (error.code === "auth/weak-password") {
            alert("A senha é muito fraca. Use uma senha mais forte.");
        } else {
            alert("Erro no registro: " + error.message);
        }
    }
}

function showLoading() {
    console.log("Loading...");
}

function hideLoading() {
    console.log("Loading hidden...");
}

function showToast(message, type) {
    console.log(type + ": " + message);
}

document.getElementById("register-button").addEventListener("click", register);

form.email().addEventListener("input", onChangeEmail);
form.password().addEventListener("input", onChangePassword);
form.confirmPassword().addEventListener("input", onChangeConfirmPassword);
