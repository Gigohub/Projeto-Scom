// Lógica do dashboard: perfil, estatísticas, histórico de partidas e painel admin.

let paginaAtual = 1;

function formatarData(texto) {
    // "2026-10-13 14:03:22" -> "13/10/2026 14:03"
    const [data, hora] = String(texto).split(" ");
    const [a, m, d] = data.split("-");
    return `${d}/${m}/${a} ${hora.slice(0, 5)}`;
}

async function carregarUsuario() {
    try {
        const dados = await apiFetch("auth/me.php");
        definirTokenCsrf(dados.csrf_token);
        return dados.usuario;
    } catch (erro) {
        if (erro.status === 401) {
            location.replace("login.html?next=dashboard.html"); // rota protegida
            return null;
        }
        throw erro;
    }
}

function renderizarPerfil(usuario) {
    document.querySelector("#perfil-nome").textContent = usuario.nome;
    document.querySelector("#perfil-email").textContent = usuario.email;
    document.querySelector("#perfil-papel").textContent = usuario.papel === "admin" ? "Administrador" : "Jogador";
    document.querySelector("#saudacao").textContent = `Olá, ${usuario.nome}!`;
    document.querySelector("#form-nome").nome.value = usuario.nome;
    document.querySelector("#painel-admin").hidden = usuario.papel !== "admin";
}

function renderizarEstatisticas(est) {
    document.querySelector("#est-total").textContent = est.total;
    document.querySelector("#est-vitorias").textContent = est.vitorias;
    document.querySelector("#est-derrotas").textContent = est.derrotas;
    document.querySelector("#est-taxa").textContent = `${est.taxa_vitoria}%`;
    document.querySelector("#est-media").textContent = est.media_vida_final;
}

function renderizarHistorico(itens) {
    const corpo = document.querySelector("#tabela-historico tbody");
    corpo.replaceChildren();

    if (itens.length === 0) {
        const linha = corpo.insertRow();
        const celula = linha.insertCell();
        celula.colSpan = 6;
        celula.textContent = "Nenhuma partida registrada ainda. Que tal jogar uma?";
        return;
    }

    itens.forEach((p) => {
        const linha = corpo.insertRow();
        linha.insertCell().textContent = formatarData(p.jogada_em);

        const resultado = linha.insertCell();
        const selo = document.createElement("span");
        selo.className = `selo selo--${p.resultado}`;
        selo.textContent = p.resultado === "vitoria" ? "Vitória" : "Derrota";
        resultado.appendChild(selo);
        if (p.motivo === "combo_sagrado") resultado.append(" ✨ combo");

        linha.insertCell().textContent = p.vida_final;
        linha.insertCell().textContent = p.vida_oponente;
        linha.insertCell().textContent = p.turnos;

        const acoes = linha.insertCell();
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "botao-mini";
        botao.textContent = "Excluir";
        botao.addEventListener("click", () => excluirPartida(p.id));
        acoes.appendChild(botao);
    });
}

async function carregarHistorico() {
    const dados = await apiFetch(`partidas.php?pagina=${paginaAtual}&limite=10`);
    renderizarEstatisticas(dados.estatisticas);
    renderizarHistorico(dados.itens);

    document.querySelector("#pagina-info").textContent = `Página ${dados.pagina} de ${dados.total_paginas}`;
    document.querySelector("#pagina-anterior").disabled = dados.pagina <= 1;
    document.querySelector("#pagina-proxima").disabled = dados.pagina >= dados.total_paginas;
}

async function excluirPartida(id) {
    if (!confirm("Excluir esta partida do histórico?")) return;
    try {
        await apiFetch(`partidas.php?id=${id}`, { metodo: "DELETE" });
        await carregarHistorico();
    } catch (erro) {
        alert(erro.message);
    }
}

async function carregarUsuariosAdmin(usuarioAtual) {
    const dados = await apiFetch("admin/usuarios.php");
    const corpo = document.querySelector("#tabela-usuarios tbody");
    corpo.replaceChildren();

    dados.usuarios.forEach((u) => {
        const linha = corpo.insertRow();
        linha.insertCell().textContent = u.id;
        linha.insertCell().textContent = u.nome;
        linha.insertCell().textContent = u.email;
        linha.insertCell().textContent = u.papel;
        linha.insertCell().textContent = u.total_partidas;

        const acoes = linha.insertCell();

        const alternar = document.createElement("button");
        alternar.type = "button";
        alternar.className = "botao-mini";
        alternar.textContent = u.papel === "admin" ? "Tornar jogador" : "Tornar admin";
        alternar.addEventListener("click", async () => {
            try {
                await apiFetch(`admin/usuarios.php?id=${u.id}`, {
                    metodo: "PUT",
                    corpo: { papel: u.papel === "admin" ? "jogador" : "admin" },
                });
                await carregarUsuariosAdmin(usuarioAtual);
            } catch (erro) {
                alert(erro.message);
            }
        });
        acoes.appendChild(alternar);

        const excluir = document.createElement("button");
        excluir.type = "button";
        excluir.className = "botao-mini botao-mini--perigo";
        excluir.textContent = "Excluir";
        excluir.addEventListener("click", async () => {
            if (!confirm(`Excluir o usuário ${u.nome} e todas as partidas dele?`)) return;
            try {
                await apiFetch(`admin/usuarios.php?id=${u.id}`, { metodo: "DELETE" });
                if (u.id === usuarioAtual.id) {
                    location.replace("login.html");
                    return;
                }
                await carregarUsuariosAdmin(usuarioAtual);
            } catch (erro) {
                alert(erro.message);
            }
        });
        acoes.appendChild(excluir);
    });
}

function ligarEventos(usuario) {
    document.querySelector("#botao-sair").addEventListener("click", async () => {
        try {
            await apiFetch("auth/logout.php", { metodo: "POST" });
        } finally {
            definirTokenCsrf(null);
            location.replace("login.html");
        }
    });

    document.querySelector("#pagina-anterior").addEventListener("click", () => {
        paginaAtual = Math.max(1, paginaAtual - 1);
        carregarHistorico();
    });
    document.querySelector("#pagina-proxima").addEventListener("click", () => {
        paginaAtual += 1;
        carregarHistorico();
    });

    const formNome = document.querySelector("#form-nome");
    formNome.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const aviso = document.querySelector("#mensagem-perfil");
        try {
            const dados = await apiFetch("perfil.php", { metodo: "PUT", corpo: { nome: formNome.nome.value.trim() } });
            renderizarPerfil(dados.usuario);
            mostrarMensagem(aviso, "Nome atualizado!", "sucesso");
        } catch (erro) {
            mostrarMensagem(aviso, erro.campos?.nome || erro.message, "erro");
        }
    });
}

function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `mensagem mensagem--${tipo}`;
    elemento.hidden = !texto;
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await carregarUsuario();
    if (!usuario) return;

    renderizarPerfil(usuario);
    ligarEventos(usuario);
    await carregarHistorico();
    if (usuario.papel === "admin") await carregarUsuariosAdmin(usuario);
});
