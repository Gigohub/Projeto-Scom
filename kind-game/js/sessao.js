// js/Sessao.js
// Área de conta do menu da homepage: mostra "Entrar / Criar conta" ou os
// dados da conta logada (nome, perfil, vitórias e derrotas, botão Sair).
// Depende de js/api.js carregado antes.

/**
 * Cria um elemento HTML com classe e conteúdo de texto opcionais.
 */
function criarElemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto; // textContent: evita XSS/interpretação de HTML
    return el;
}

/**
 * Monta os botões padrão de "Entrar" e "Criar conta" para usuários não autenticados.
 */
function montarVisitante(item) {
    item.replaceChildren();
    const entrar = criarElemento('a', 'botao botao--menu', 'Entrar');
    entrar.href = 'login.html';
    const criar = criarElemento('a', 'botao botao--menu', 'Criar conta');
    criar.href = 'cadastro.html';
    item.append(entrar, criar);
}

/**
 * Monta o menu da conta quando o usuário está logado.
 */
function montarLogado(item, usuario, estatisticas) {
    item.replaceChildren();

    const perfil = criarElemento('a', 'botao botao--menu conta__perfil');
    perfil.href = 'dashboard.html';
    const email = usuario.email || '';
    const nome = usuario.nome || 'Jogador';
    perfil.title = `${email} · abrir meu dashboard`;

    const avatar = criarElemento('span', 'conta__avatar', nome.charAt(0).toUpperCase());
    avatar.setAttribute('aria-hidden', 'true');
    perfil.append(avatar, criarElemento('span', 'conta__nome', nome));
    item.append(perfil);

    if (usuario.papel === 'admin') {
        item.append(criarElemento('span', 'conta__selo', 'Admin'));
    }

    if (estatisticas) {
        const vitorias = estatisticas.vitorias ?? 0;
        const derrotas = estatisticas.derrotas ?? 0;
        item.append(criarElemento('span', 'conta__stats', `${vitorias}V · ${derrotas}D`));
    }

    const sair = criarElemento('button', 'botao botao--menu conta__sair', 'Sair');
    sair.type = 'button';
    sair.addEventListener('click', async () => {
        sair.disabled = true;
        try {
            await apiFetch('auth/logout.php', { metodo: 'POST' });
        } catch (e) {
            /* mesmo se o logout no servidor falhar, limpa localmente */
        }
        if (typeof definirTokenCsrf === 'function') {
            definirTokenCsrf(null);
        }
        montarVisitante(item);
    });
    item.append(sair);
}

/**
 * Consulta a sessão no servidor e atualiza o cabeçalho dinamicamente.
 */
async function iniciarAreaDeConta() {
    const lista = document.querySelector('.menu__lista');
    if (!lista) return;

    // Remove botões de login manuais/estáticos do HTML para evitar duplicidade
    lista.querySelectorAll('a[href*="login"]').forEach((a) => (a.closest('li') || a).remove());

    const item = document.createElement('li');
    item.className = 'conta';
    item.hidden = true; // Oculta até que a resposta da API chegue (evita efeito visual de "piscada")
    lista.append(item);

    try {
        const dados = await apiFetch('auth/me.php');
        if (typeof definirTokenCsrf === 'function' && dados?.csrf_token) {
            definirTokenCsrf(dados.csrf_token);
        }

        const usuario = dados?.usuario || dados?.dados?.usuario;
        if (!usuario) {
            montarVisitante(item);
            item.hidden = false;
            return;
        }

        let estatisticas = null;
        try {
            const respPartidas = await apiFetch('partidas.php?limite=1');
            const payload = respPartidas?.dados || respPartidas;
            estatisticas = payload?.resumo || payload?.estatisticas || null;
        } catch (e) {
            /* se falhar a busca de estatísticas, exibe o perfil normal sem o placar */
        }

        montarLogado(item, usuario, estatisticas);
    } catch (erro) {
        montarVisitante(item); // Se retornar 401 ou erro de rede, exibe botões de visitante
    }
    item.hidden = false;
}

document.addEventListener('DOMContentLoaded', iniciarAreaDeConta);