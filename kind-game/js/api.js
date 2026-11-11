// Cliente HTTP do Kind Game: fala com o backend PHP (pasta /api) em JSON.
// Cuida do token CSRF e converte erros HTTP em exceções com mensagem legível.

const API_BASE = "api";
let tokenCsrf = null;

async function obterTokenCsrf() {
    if (tokenCsrf) return tokenCsrf;
    const resposta = await fetch(`${API_BASE}/csrf.php`, { credentials: "same-origin" });
    const json = await resposta.json();
    tokenCsrf = json.dados.csrf_token;
    return tokenCsrf;
}

function definirTokenCsrf(novoToken) {
    tokenCsrf = novoToken || null;
}

async function apiFetch(caminho, { metodo = "GET", corpo = null } = {}) {
    const opcoes = {
        method: metodo,
        credentials: "same-origin", // envia o cookie de sessão
        headers: { Accept: "application/json" },
    };

    if (metodo !== "GET") {
        opcoes.headers["Content-Type"] = "application/json";
        opcoes.headers["X-CSRF-Token"] = await obterTokenCsrf();
        if (corpo !== null) opcoes.body = JSON.stringify(corpo);
    }

    let resposta;
    try {
        resposta = await fetch(`${API_BASE}/${caminho}`, opcoes);
    } catch (e) {
        const erro = new Error("Não foi possível conectar ao servidor. O Apache/XAMPP está ligado?");
        erro.status = 0;
        throw erro;
    }

    let json = null;
    try {
        json = await resposta.json();
    } catch (e) {
        /* resposta sem JSON (ex.: erro fatal do PHP) */
    }

    if (!resposta.ok || !json || json.sucesso !== true) {
        const info = (json && json.erro) || {};
        const erro = new Error(info.mensagem || "Erro inesperado no servidor.");
        erro.status = resposta.status;
        erro.campos = info.campos || {};
        throw erro;
    }
    return json.dados;
}

// Escapa texto antes de colocar em innerHTML (defesa contra XSS).
function escaparHtml(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
