// Integração do jogo (index.html) com o backend: exige login e salva a partida.
// Depende de js/api.js (apiFetch) e das variáveis globais do index.js
// (jogador, oponente, turnState, jogoTerminado) e da função encerrarPartida.

let partidaSalva = false; // evita salvar a mesma partida duas vezes

// ---------- 1) Rota protegida + mostra quem está logado ----------
async function exigirLoginNoJogo() {
    try {
        const dados = await apiFetch('auth/me.php');
        definirTokenCsrf(dados.csrf_token);

        const hud = document.querySelector('.hud-vida');
        if (hud) {
            const conta = document.createElement('span');
            conta.className = 'vida-label';
            conta.textContent = `Conta: ${dados.usuario.nome}`; // textContent: sem XSS
            hud.appendChild(conta);
        }
    } catch (erro) {
        if (erro.status === 401) {
            location.replace('login.html?next=index.html');
        } else {
            console.warn('[historico] não foi possível confirmar a sessão:', erro.message);
        }
    }
}

// ---------- 2) Área de status dentro do popup de fim de jogo ----------
function elementoDeStatus() {
    let el = document.querySelector('#popup-salvamento');
    if (!el) {
        // Se você esqueceu de colocar o <p id="popup-salvamento"> no HTML, ele é criado aqui.
        const caixa = document.querySelector('#popup-vitoria .popup-caixa') || document.body;
        el = document.createElement('p');
        el.id = 'popup-salvamento';
        el.setAttribute('role', 'status');
        caixa.insertBefore(el, caixa.querySelector('.popup-botoes'));
    }
    return el;
}

function mostrarStatus(texto, linkTexto = null, linkHref = null) {
    const el = elementoDeStatus();
    el.textContent = texto;
    if (linkTexto) {
        const link = document.createElement('a');
        link.href = linkHref;
        link.textContent = linkTexto;
        el.append(' ', link);
    }
}

// ---------- 3) Envia a partida ao servidor ----------
async function registrarPartidaNoServidor(tipo, jogadorQueAcionou) {
    if (partidaSalva) return;
    partidaSalva = true;

    const venceu = tipo === 'vitoria' || (tipo === 'comboSagrado' && jogadorQueAcionou === jogador);
    const dados = {
        resultado: venceu ? 'vitoria' : 'derrota',
        motivo: tipo === 'comboSagrado' ? 'combo_sagrado' : 'lp',
        vida_final: jogador.vidaPontos,
        vida_oponente: oponente.vidaPontos,
        turnos: turnState.numeroDoTurno,
    };
    console.info('[historico] enviando partida:', dados);
    mostrarStatus('Salvando partida no seu histórico...');

    for (let tentativa = 1; tentativa <= 2; tentativa++) {
        try {
            const resposta = await apiFetch('partidas.php', { metodo: 'POST', corpo: dados });
            console.info('[historico] partida salva:', resposta);
            mostrarStatus('✅ Partida salva no seu histórico.', 'Ver histórico', 'dashboard.html');
            return;
        } catch (erro) {
            // Token CSRF velho (ex.: sessão renovada): busca um novo e tenta mais uma vez.
            if (erro.status === 403 && tentativa === 1) {
                definirTokenCsrf(null);
                continue;
            }
            console.error('[historico] falha ao salvar:', erro.status, erro.message, erro.campos);

            let motivo = erro.message;
            if (erro.status === 401) {
                motivo = 'sua sessão expirou. Entre de novo para salvar.';
            } else if (erro.status === 404) {
                motivo = 'o arquivo api/partidas.php não foi encontrado no servidor.';
            } else if (erro.status === 422) {
                const detalhes = Object.values(erro.campos || {}).filter(Boolean).join(' ');
                motivo = `o servidor recusou os dados. ${detalhes}`;
            }
            mostrarStatus(`⚠️ Não foi possível salvar a partida (${erro.status || 'sem conexão'}): ${motivo}`);
            partidaSalva = false; // permite diagnosticar e tentar de novo pelo Console
            return;
        }
    }
}

// ---------- 4) Gancho automático: salva quando o jogo termina ----------
// Troca encerrarPartida por uma versão que chama a original e depois salva.
// Assim não é preciso editar o index.js. Se você já colocou a chamada
// registrarPartidaNoServidor(...) lá dentro, a trava `partidaSalva` impede o duplicado.
function instalarGanchoDeFimDeJogo() {
    if (typeof encerrarPartida !== 'function') {
        console.error('[historico] encerrarPartida não existe: confira se o index.js foi carregado.');
        return;
    }
    if (encerrarPartida.__comHistorico) return;

    const original = encerrarPartida;
    encerrarPartida = function (tipo, jogadorQueAcionou = null) {
        const jaTerminado = typeof jogoTerminado !== 'undefined' && jogoTerminado;
        original.call(this, tipo, jogadorQueAcionou);
        if (!jaTerminado) registrarPartidaNoServidor(tipo, jogadorQueAcionou);
    };
    encerrarPartida.__comHistorico = true;
}

// ---------- 5) Diagnóstico: rode  diagnosticoHistorico()  no Console do jogo ----------
async function diagnosticoHistorico() {
    console.group('Diagnóstico do histórico');
    console.log('api.js carregado:', typeof apiFetch === 'function');
    console.log('encerrarPartida existe:', typeof encerrarPartida === 'function',
        '| gancho instalado:', !!(typeof encerrarPartida === 'function' && encerrarPartida.__comHistorico));
    try {
        const me = await apiFetch('auth/me.php');
        console.log('Sessão ativa como:', me.usuario.email, `(${me.usuario.papel})`);
    } catch (e) {
        console.warn('Sessão:', e.status, e.message);
    }
    try {
        const lista = await apiFetch('partidas.php?limite=1');
        console.log('GET partidas.php OK. Partidas salvas:', lista.estatisticas.total);
    } catch (e) {
        console.warn('partidas.php:', e.status, e.message);
    }
    console.groupEnd();
}

document.addEventListener('DOMContentLoaded', () => {
    instalarGanchoDeFimDeJogo();
    exigirLoginNoJogo();
});
