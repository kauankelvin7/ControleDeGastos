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
        showToast('Erro ao fazer logout.', 'error');
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
    if (email === "") {
        form.emailError().style.display = "none";
        form.email().classList.remove("input--error", "input--success");
    } else if (emailValid) {
        form.emailError().style.display = "none";
        form.email().classList.remove("input--error");
        form.email().classList.add("input--success");
    } else {
        form.emailError().style.display = "block";
        form.email().classList.remove("input--success");
        form.email().classList.add("input--error");
    }

    // Atualizar o estado do botão de registro
    updateRegisterButtonState();
}

// Função para verificar a validade da senha
function onChangePassword() {
    const password = form.password().value;
    passwordValid = validatePassword(password);

    // Mostrar/ocultar as mensagens de erro
    if (password === "") {
        form.passwordError().style.display = "none";
        form.password().classList.remove("input--error", "input--success");
    } else if (passwordValid) {
        form.passwordError().style.display = "none";
        form.password().classList.remove("input--error");
        form.password().classList.add("input--success");
    } else {
        form.passwordError().style.display = "block";
        form.password().classList.remove("input--success");
        form.password().classList.add("input--error");
    }

    // Revalida a confirmação caso a senha original seja alterada depois
    if (form.confirmPassword().value.length > 0) {
        onChangeConfirmPassword();
    }

    // Atualizar o estado do botão de registro
    updateRegisterButtonState();
}

// Função para verificar a confirmação da senha
function onChangeConfirmPassword() {
    const password = form.password().value;
    const confirmPassword = form.confirmPassword().value;
    // Garante que o usuário digitou algo antes de considerar válido
    confirmPasswordValid = (password === confirmPassword && confirmPassword.length > 0);

    // Mostrar/ocultar as mensagens de erro
    if (confirmPassword === "") {
        form.passwordDoesntMatchError().style.display = "none";
        form.confirmPassword().classList.remove("input--error", "input--success");
    } else if (confirmPasswordValid) {
        form.passwordDoesntMatchError().style.display = "none";
        form.confirmPassword().classList.remove("input--error");
        form.confirmPassword().classList.add("input--success");
    } else {
        form.passwordDoesntMatchError().style.display = "block";
        form.confirmPassword().classList.remove("input--success");
        form.confirmPassword().classList.add("input--error");
    }

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
            showToast("Este email já está em uso. Tente outro.", "error");
        } else if (error.code === "auth/weak-password") {
            showToast("A senha é muito fraca. Use uma senha mais forte.", "warning");
        } else {
            showToast("Erro no registro: " + error.message, "error");
        }
    }
}

function showLoading() {
    console.log("Loading...");
    // Se você tiver um componente de loading real (spinner), ative-o aqui.
}

function hideLoading() {
    console.log("Loading hidden...");
    // Desative o componente de loading aqui.
}

function showToast(message, type = "info") {
    console.log(type + ": " + message);
    
    // Implementação visual flutuante baseada no components.css
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    // Pequeno atraso para a classe de transição engatilhar a animação CSS
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add("toast--visible");
        });
    });
    
    // Remover o toast após 3.5 segundos
    setTimeout(() => {
        toast.classList.remove("toast--visible");
        toast.addEventListener("transitionend", () => toast.remove());
    }, 3500);
}

document.getElementById("register-button").addEventListener("click", register);

form.email().addEventListener("input", onChangeEmail);
form.password().addEventListener("input", onChangePassword);
form.confirmPassword().addEventListener("input", onChangeConfirmPassword);