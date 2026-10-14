// Lógica das páginas login.html e cadastro.html.

function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto; // textContent: nunca interpreta HTML
    elemento.className = `mensagem mensagem--${tipo}`;
    elemento.hidden = !texto;
}

function limparErrosDeCampo(formulario) {
    formulario.querySelectorAll(".campo__erro").forEach((el) => (el.textContent = ""));
}

function mostrarErrosDeCampo(formulario, campos) {
    Object.entries(campos || {}).forEach(([nome, mensagem]) => {
        const alvo = formulario.querySelector(`[data-erro-de="${nome}"]`);
        if (alvo && mensagem) alvo.textContent = mensagem;
    });
}

// Só aceita redirecionar para páginas do próprio site (evita open redirect).
function destinoSeguro() {
    const next = new URLSearchParams(location.search).get("next");
    return next && /^[a-z0-9_-]+\.html$/i.test(next) ? next : "dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.querySelector("#form-login");
    const formCadastro = document.querySelector("#form-cadastro");

    if (formLogin) {
        const aviso = document.querySelector("#mensagem");
        formLogin.addEventListener("submit", async (evento) => {
            evento.preventDefault();
            limparErrosDeCampo(formLogin);
            mostrarMensagem(aviso, "", "erro");

            const botao = formLogin.querySelector("button[type=submit]");
            botao.disabled = true;
            try {
                const dados = await apiFetch("auth/login.php", {
                    metodo: "POST",
                    corpo: {
                        email: formLogin.email.value.trim(),
                        senha: formLogin.senha.value,
                    },
                });
                definirTokenCsrf(dados.csrf_token); // a sessão foi regenerada: token novo
                location.href = destinoSeguro();
            } catch (erro) {
                mostrarMensagem(aviso, erro.message, "erro");
                mostrarErrosDeCampo(formLogin, erro.campos);
                formLogin.senha.value = "";
            } finally {
                botao.disabled = false;
            }
        });
    }

    if (formCadastro) {
        const aviso = document.querySelector("#mensagem");
        formCadastro.addEventListener("submit", async (evento) => {
            evento.preventDefault();
            limparErrosDeCampo(formCadastro);
            mostrarMensagem(aviso, "", "erro");

            if (formCadastro.senha.value !== formCadastro.confirmar.value) {
                mostrarErrosDeCampo(formCadastro, { confirmar: "As senhas não coincidem." });
                return;
            }

            const botao = formCadastro.querySelector("button[type=submit]");
            botao.disabled = true;
            try {
                await apiFetch("auth/register.php", {
                    metodo: "POST",
                    corpo: {
                        nome: formCadastro.nome.value.trim(),
                        email: formCadastro.email.value.trim(),
                        senha: formCadastro.senha.value,
                    },
                });
                mostrarMensagem(aviso, "Conta criada! Redirecionando para o login...", "sucesso");
                setTimeout(() => (location.href = "login.html"), 1200);
            } catch (erro) {
                mostrarMensagem(aviso, erro.message, "erro");
                mostrarErrosDeCampo(formCadastro, erro.campos);
            } finally {
                botao.disabled = false;
            }
        });
    }
});
