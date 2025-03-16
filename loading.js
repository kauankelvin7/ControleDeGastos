// Constante para texto de loading
const LOADING_TEXT = "Carregando...";

// Identificador único para o elemento de loading
const LOADING_CLASS = "loading-overlay";

function showLoading(text = "Carregando...") {
   // Verifica se já existe um loading para evitar duplicatas
   if (document.querySelector('.loading')) {
       return;
   }

   const div = document.createElement("div");
   div.classList.add("loading", "centralize");

   const label = document.createElement("label");
   label.innerText = text;

   div.appendChild(label);
   document.body.appendChild(div);
}

function hideLoading() {
   const loadings = document.getElementsByClassName("loading");
   while (loadings.length > 0) {
       loadings[0].remove();
   }
}
