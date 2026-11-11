let paginaAtual = 1;

function formatarData(texto) {
    if (!texto) return '-';
    const [data, hora] = String(texto).split(' ');
    if (!data) return texto;
    const partes = data.split('-');
    if (partes.length < 3) return texto;
    const [a, m, d] = partes;
    const horaMin = hora ? hora.slice(0, 5) : '';
    return `${d}/${m}/${a} ${horaMin}`.trim();
}

async function carregarUsuario() {
    try {
        const dados = await apiFetch('auth/me.php');
        if (dados && dados.csrf_token) {
            definirTokenCsrf(dados.csrf_token);
        }
        const usuario = dados?.usuario || dados?.dados?.usuario;
        if (usuario) {
            renderizarPerfil(usuario);
            return usuario;
        }
    } catch (erro) {
        console.warn('Sessão expirada ou não autenticada. Redirecionando...', erro);
        window.location.href = 'login.html';
        return null;
    }
}

function renderizarPerfil(usuario) {
    const elSaudacao = document.querySelector('#saudacao');
    const elNome = document.querySelector('#perfil-nome');
    const elEmail = document.querySelector('#perfil-email');
    const elPapel = document.querySelector('#perfil-papel');

    if (elSaudacao) elSaudacao.textContent = `Olá, ${usuario.nome || 'Jogador'}!`;
    if (elNome) elNome.textContent = usuario.nome || '';
    if (elEmail) elEmail.textContent = usuario.email || '';
    if (elPapel) elPapel.textContent = usuario.papel === 'admin' ? 'Administrador' : 'Jogador';
}

function renderizarEstatisticas(est) {
    const e = est || {};
    const elTotal = document.querySelector('#est-total');
    const elVitorias = document.querySelector('#est-vitorias');
    const elDerrotas = document.querySelector('#est-derrotas');
    const elTaxa = document.querySelector('#est-taxa');
    const elMedia = document.querySelector('#est-media');

    if (elTotal) elTotal.textContent = e.total ?? 0;
    if (elVitorias) elVitorias.textContent = e.vitorias ?? 0;
    if (elDerrotas) elDerrotas.textContent = e.derrotas ?? 0;
    if (elTaxa) elTaxa.textContent = `${e.taxa_vitoria ?? 0}%`;
    if (elMedia) elMedia.textContent = e.media_vida_final ?? 0;
}

function renderizarHistorico(itens) {
    const corpo = document.querySelector('#tabela-historico tbody');
    if (!corpo) return;

    corpo.replaceChildren();

    if (!itens || itens.length === 0) {
        const linha = corpo.insertRow();
        const celula = linha.insertCell();
        celula.colSpan = 6;
        celula.textContent = 'Nenhuma partida registrada ainda. Que tal jogar uma?';
        return;
    }

    itens.forEach((p) => {
        const linha = corpo.insertRow();
        
        // Data
        linha.insertCell().textContent = formatarData(p.jogada_em);
        
        // Resultado com Selo
        const celulaResultado = linha.insertCell();
        const selo = document.createElement('span');
        selo.className = `selo selo--${p.resultado}`;
        selo.textContent = p.resultado === 'vitoria' ? 'Vitória' : 'Derrota';
        celulaResultado.appendChild(selo);
        if (p.motivo === 'combo_sagrado') {
            celulaResultado.append(' combo');
        }

        // Seus LP Finais
        linha.insertCell().textContent = p.vida_final ?? 0;
        
        // LP do Oponente
        linha.insertCell().textContent = p.vida_oponente ?? 0;
        
        // Turnos
        linha.insertCell().textContent = p.turnos ?? 0;

        // Botão de Excluir
        const celulaAcao = linha.insertCell();
        const botaoExcluir = document.createElement('button');
        botaoExcluir.type = 'button';
        botaoExcluir.className = 'botao-mini';
        botaoExcluir.textContent = 'Excluir';
        botaoExcluir.addEventListener('click', () => excluirPartida(p.id));
        celulaAcao.appendChild(botaoExcluir);
    });
}

async function carregarHistorico(pagina = 1) {
    try {
        paginaAtual = pagina;
        const resposta = await apiFetch(`partidas.php?pagina=${paginaAtual}&limite=10`);
        if (!resposta) return;

        const payload = resposta.dados ? resposta.dados : resposta;
        const estatisticas = payload.estatisticas || payload.resumo || { total: 0, vitorias: 0, derrotas: 0, taxa_vitoria: 0, media_vida_final: 0 };
        const itens = payload.itens || payload.partidas || [];
        const totalPaginas = payload.total_paginas || 1;

        renderizarEstatisticas(estatisticas);
        renderizarHistorico(itens);

        const elInfo = document.querySelector('#pagina-info');
        const btnAnterior = document.querySelector('#pagina-anterior');
        const btnProxima = document.querySelector('#pagina-proxima');

        if (elInfo) elInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        if (btnAnterior) btnAnterior.disabled = paginaAtual <= 1;
        if (btnProxima) btnProxima.disabled = paginaAtual >= totalPaginas;

    } catch (erro) {
        console.warn('Não foi possível carregar o histórico de partidas:', erro);
        renderizarEstatisticas({ total: 0, vitorias: 0, derrotas: 0, taxa_vitoria: 0, media_vida_final: 0 });
        const corpo = document.querySelector('#tabela-historico tbody');
        if (corpo) {
            corpo.innerHTML = `<tr><td colspan="6">Não foi possível carregar o histórico (${erro.status || 'erro'}): ${erro.message}</td></tr>`;
        }
    }
}

async function carregarUsuariosAdmin() {
    const painelAdmin = document.querySelector('#painel-admin');
    if (!painelAdmin) return;

    try {
        const resposta = await apiFetch('usuarios.php');
        const usuarios = resposta?.usuarios || resposta?.dados?.usuarios || [];
        painelAdmin.hidden = false;

        const corpo = document.querySelector('#tabela-usuarios tbody');
        if (!corpo) return;

        corpo.replaceChildren();

        if (usuarios.length === 0) {
            const linha = corpo.insertRow();
            const celula = linha.insertCell();
            celula.colSpan = 5;
            celula.textContent = 'Nenhum usuário cadastrado no sistema.';
            return;
        }

        usuarios.forEach((u) => {
            const linha = corpo.insertRow();
            
            // 1. ID
            linha.insertCell().textContent = u.id;
            // 2. Nome
            linha.insertCell().textContent = u.nome || '-';
            // 3. E-mail
            linha.insertCell().textContent = u.email || '-';
            // 4. Perfil
            linha.insertCell().textContent = u.papel === 'admin' ? 'Administrador' : 'Jogador';

            // 5. Ações
            const celulaAcoes = linha.insertCell();
            
            const btnPapel = document.createElement('button');
            btnPapel.type = 'button';
            btnPapel.className = 'botao-mini';
            btnPapel.textContent = u.papel === 'admin' ? 'Tornar Jogador' : 'Tornar Admin';
            btnPapel.addEventListener('click', async () => {
                const novoPapel = u.papel === 'admin' ? 'jogador' : 'admin';
                try {
                    await apiFetch(`usuarios.php?id=${u.id}`, {
                        metodo: 'PUT',
                        corpo: { papel: novoPapel }
                    });
                    await carregarUsuariosAdmin();
                } catch (erro) {
                    alert(`Erro ao alterar perfil: ${erro.message}`);
                }
            });
            celulaAcoes.appendChild(btnPapel);

            const btnExcluir = document.createElement('button');
            btnExcluir.type = 'button';
            btnExcluir.className = 'botao-mini';
            btnExcluir.style.marginLeft = '6px';
            btnExcluir.textContent = 'Excluir';
            btnExcluir.addEventListener('click', async () => {
                if (!confirm(`Tem certeza que deseja excluir o usuário "${u.nome}"?`)) return;
                try {
                    await apiFetch(`usuarios.php?id=${u.id}`, { metodo: 'DELETE' });
                    await carregarUsuariosAdmin();
                } catch (erro) {
                    alert(`Erro ao excluir usuário: ${erro.message}`);
                }
            });
            celulaAcoes.appendChild(btnExcluir);
        });
    } catch (erro) {
        painelAdmin.hidden = true;
    }
}

async function excluirPartida(id) {
    if (!confirm('Excluir esta partida do histórico?')) return;
    try {
        await apiFetch(`partidas.php?id=${id}`, { metodo: 'DELETE' });
        await carregarHistorico(paginaAtual);
    } catch (erro) {
        alert(`Erro ao excluir partida: ${erro.message}`);
    }
}

function ligarEventos() {
    const btnSair = document.querySelector('#botao-sair');
    if (btnSair) {
        btnSair.addEventListener('click', async () => {
            try {
                await apiFetch('auth/logout.php', { metodo: 'POST' });
            } finally {
                definirTokenCsrf(null);
                window.location.href = 'login.html';
            }
        });
    }

    const btnAnterior = document.querySelector('#pagina-anterior');
    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            if (paginaAtual > 1) {
                carregarHistorico(paginaAtual - 1);
            }
        });
    }

    const btnProxima = document.querySelector('#pagina-proxima');
    if (btnProxima) {
        btnProxima.addEventListener('click', () => {
            carregarHistorico(paginaAtual + 1);
        });
    }

    const formNome = document.querySelector('#form-nome');
    if (formNome) {
        formNome.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const inputNome = document.querySelector('#nome');
            const msgPerfil = document.querySelector('#mensagem-perfil');
            if (!inputNome) return;

            const novoNome = inputNome.value.trim();
            if (!novoNome) return;

            try {
                if (msgPerfil) {
                    msgPerfil.hidden = false;
                    msgPerfil.textContent = 'Salvando...';
                    msgPerfil.style.color = '';
                }

                const resposta = await apiFetch('perfil.php', {
                    metodo: 'PUT',
                    corpo: { nome: novoNome }
                });

                const usuarioAtualizado = resposta?.usuario || resposta?.dados?.usuario;
                if (usuarioAtualizado) {
                    renderizarPerfil(usuarioAtualizado);
                } else {
                    document.querySelector('#saudacao').textContent = `Olá, ${novoNome}!`;
                    document.querySelector('#perfil-nome').textContent = novoNome;
                }

                if (msgPerfil) {
                    msgPerfil.textContent = '✅ Nome alterado com sucesso!';
                    msgPerfil.style.color = '#2e7d32';
                }
                inputNome.value = '';
            } catch (erro) {
                if (msgPerfil) {
                    msgPerfil.hidden = false;
                    msgPerfil.textContent = `⚠️ Erro ao salvar: ${erro.message}`;
                    msgPerfil.style.color = '#d32f2f';
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = await carregarUsuario();
    if (usuario) {
        ligarEventos();
        await carregarHistorico(1);
        if (usuario.papel === 'admin') {
            await carregarUsuariosAdmin();
        }
    }
});