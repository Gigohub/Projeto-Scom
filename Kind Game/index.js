let selectedCard = null;
let jogoTerminado = false; // trava o jogo assim que alguém perde
let timeoutEsconderPreview = null; // NOVO: controla o pequeno atraso antes de esconder o preview


function construirMarkupCarta(carta){
    const statsHtml = carta.tipo === "action"
      ? `<div class="card-stats">
            <span class="atk">ATK/${carta.atk}</span>
            <span class="def">DEF/${carta.def}</span>
        </div>`
      : "";
    const nivelHtml = carta.tipo === "action"
        ? `<span class="card-nivel">${"★".repeat(carta.nivel)}</span>`
        : "";

    return `
    <div class="card-inner">
      <div class="card-front card-${carta.tipo.toLowerCase()}">
        <div class="card-header">
          <span class="card-nome">${carta.nome}</span>
          ${nivelHtml}
        </div>
        <div class="card-arte">
          <img src="${carta.imagem}" alt="${carta.nome}">
        </div>
        <div class="card-efeito">${carta.efeito}</div>
        ${statsHtml}
      </div>
      <div class="card-back">
        <img src="images/coffe.jpg" class="card-img" alt="Verso da carta">
      </div>
    </div>
  `;
}

function gerarCarta(carta){
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.dataset.id = carta.id;
    cardDiv.innerHTML = construirMarkupCarta(carta);

    // Ao passar o mouse, mostra essa mesma carta ampliada na barra lateral.
    // Ao tirar o mouse, AGENDAMOS o fechamento (em vez de fechar na hora) —
    // isso dá tempo do cursor "viajar" até o painel de preview sem que ele
    // suma no meio do caminho. Veja agendarEsconderPreview() mais abaixo.
    cardDiv.addEventListener("mouseenter", () => mostrarPreview(carta));
    cardDiv.addEventListener("mouseleave", () => agendarEsconderPreview());

    return cardDiv;
}

// Preenche a caixa #preview-carta (na barra lateral) com uma versão
// ampliada da carta. Reaproveita construirMarkupCarta() para não duplicar
// a montagem do HTML — só muda o tamanho, via CSS (#preview-carta é maior
// que .card no tabuleiro).
function mostrarPreview(carta) {
    // Se já havia um "esconder" agendado (de uma carta anterior, ou do
    // próprio preview), cancela: o mouse voltou a estar sobre uma carta/preview.
    clearTimeout(timeoutEsconderPreview);

    const preview = document.querySelector("#preview-carta");
    if (!preview) return;
    preview.innerHTML = construirMarkupCarta(carta);
    preview.classList.add("visivel");
}

// NOVO: em vez de esconder na hora (esconderPreview direto), esperamos um
// pequeno intervalo. Se, durante esse intervalo, o mouse entrar em OUTRA
// carta ou no próprio painel de preview, o timeout é cancelado (por
// mostrarPreview ou pelo listener de mouseenter do preview, registrado em
// DOMContentLoaded). Só se o mouse realmente ficar fora de ambos por mais
// de 150ms é que o preview some de verdade.
function agendarEsconderPreview() {
    clearTimeout(timeoutEsconderPreview);
    timeoutEsconderPreview = setTimeout(esconderPreview, 150);
}

function esconderPreview() {
    const preview = document.querySelector("#preview-carta");
    if (!preview) return;
    preview.classList.remove("visivel");
    preview.innerHTML = "";
}

function renderHand(jogadorAlvo){
    const container = document.querySelector(".jogador-hand");
    container.innerHTML = "";
    jogadorAlvo.mao.forEach((carta) => {
        const cardElement = gerarCarta(carta);
        cardElement.addEventListener("click", () => {
            putInCamp(carta.id);
        });
        container.appendChild(cardElement);
    });

    // NOVO: toda vez que a mão do jogador é redesenhada (ou seja, toda vez
    // que ela muda — comprou carta, uma carta voltou, etc.), checamos se as
    // 5 cartas do combo sagrado estão reunidas nela.
    verificarComboSagrado(jogadorAlvo);
}

function renderhandOponent(oponente) {
  const container = document.querySelector(".oponente-hand");
  container.innerHTML = "";

  oponente.mao.forEach(() => {
    const costas = document.createElement("div");
    // "card-oculta" garante que o CSS não tente virar essa carta ao passar o mouse
    costas.classList.add("card", "card-oculta");
    costas.innerHTML = `
      <div class="card-inner">
        <div class="card-back">
          <img src="images/coffe.jpg" class="card-img" alt="Carta oculta">
        </div>
      </div>
    `;
    container.appendChild(costas);
  });

  // NOVO: o combo sagrado vale para qualquer jogador, então também checamos
  // a mão do oponente aqui (sem nunca expor os dados dela na tela — a
  // checagem olha só para o array `oponente.mao` internamente).
  verificarComboSagrado(oponente);
}

function podeInvocar(tipoCarta) {
    const turnoCorreto = turnState.jogadorDaVez === jogador && turnState.fase === "principal";
    if (!turnoCorreto) return false;

    // A regra "1 por turno" só vale para cartas de ação (monstros).
    // Cartas de pensamentos podem ser colocadas quantas vezes o jogador quiser.
    if (tipoCarta === "action") {
        return turnState.invocacoesNesteTurno < 1;
    }
    return true;
}

function putInCamp(idCarta){
    if (jogoTerminado) return;
    const carta = jogador.mao.find((c) => c.id === idCarta);
    if (!carta) return;

    if (!podeInvocar(carta.tipo)) {
        const motivo = carta.tipo === "action"
            ? "Você já colocou uma carta de ação neste turno."
            : "Só é possível colocar cartas na Fase Principal, no seu turno.";
        logMensagem(motivo);
        return;
    }
    selectedCard = idCarta;
    freeSlots(carta.tipo);
}

function freeSlots(tipoCarta){
    const linhaId = tipoCarta === "action" ? "jogador-monstros" : "jogador-magias-armadilhas";
    document.querySelectorAll(`#${linhaId} .field-slot`).forEach((slot) => {
        if (!slot.classList.contains("ocupado")) {
            slot.classList.add("selecionavel");
            slot.addEventListener("click", onSlotClicado, { once: true });
        }
    });
}

function onSlotClicado(event){
    const slot = event.currentTarget;
    const linha = slot.closest(".field-row");
    const tipoLinha = linha.id === "jogador-monstros" ? "actions" : "pensamentos";
    const numeroSlot = Number(slot.dataset.slot);

    colocarCartaNoCampo(jogador, selectedCard, tipoLinha, numeroSlot);

    // Só conta para o limite de "1 por turno" quando é uma carta de ação
    if (tipoLinha === "actions") {
        turnState.invocacoesNesteTurno++;
    }

    limparSelecao();
    atualizarBotoesDeEfeito();
}

function colocarCartaNoCampo(jogadorDono, idCarta, tipoLinha, numeroSlot) {
  const indiceNaMao = jogadorDono.mao.findIndex((c) => c.id === idCarta);
  if (indiceNaMao === -1) return;

  const [carta] = jogadorDono.mao.splice(indiceNaMao, 1);
  carta.jaAtacou = false;
  carta.efeitoUsado = false;

  jogadorDono.campo[tipoLinha][numeroSlot] = carta;
  atualizarVisualDoSlot(jogadorDono, tipoLinha, numeroSlot, carta);
  jogadorDono.ehIA ? renderhandOponent(jogadorDono) : renderHand(jogadorDono);
}

function atualizarVisualDoSlot(jogadorDono, tipoLinha, numeroSlot, carta) {
    const prefixo = jogadorDono.ehIA ? "oponente" : "jogador";
    const linhaId = tipoLinha === "actions" ? `${prefixo}-monstros` : `${prefixo}-magias-armadilhas`;
    const slot = document.querySelector(`#${linhaId} .field-slot[data-slot="${numeroSlot}"]`);
    if (!slot) return;

    slot.innerHTML = "";
    slot.appendChild(gerarCarta(carta));
    slot.classList.add("ocupado");

    if (!jogadorDono.ehIA && carta.efeito) {
        const botao = document.createElement("button");
        botao.classList.add("botao-efeito");
        botao.textContent = "Ativar Efeito";
        botao.addEventListener("click", (evento) => {
            evento.stopPropagation();
            ativarEfeito(jogadorDono, carta);
        });
        slot.appendChild(botao);
    }
    atualizarBotoesDeEfeito();
}

function limparSelecao(){
    selectedCard = null;
    document.querySelectorAll(".field-slot").forEach((slot) => {
        slot.classList.remove("selecionavel");
    });
}

function criarJogador(nome, ehIA = false) {
  return {
    nome: nome,
    ehIA: ehIA,
    vidaPontos: 4000,
    escudoAtivo: false, // usado pelo efeito "Aceitação" (nega o próximo ataque)
    reducaoDano: false, // usado pelo efeito "Ouvinte" (reduz o próximo dano recebido pela metade)
    deck: cards_catalog.map((carta) => ({ ...carta })),
    mao: [],
    campo: {
      actions: [null, null, null, null, null],
      pensamentos: [null, null, null, null, null]
    }
  };
}

const jogador = criarJogador("Jogador", false);
const oponente = criarJogador("Próximo (IA)", true);

// NOVO: as 5 cartas que, reunidas na mesma mão, vencem a partida na hora.
const COMBO_SAGRADO_IDS = ["CA-001", "VD-001", "VD-002", "VB-001", "LZ-001"];

const turnState = {
  jogadorDaVez: null,
  fase: "compra",
  numeroDoTurno: 1,
  invocacoesNesteTurno: 0
};

const ORDEM_DE_FASES = ["compra", "principal", "batalha", "final"];

function onNextPhase() {
  if (jogoTerminado) return; // nenhuma fase avança depois do fim de jogo

  limparSelecao();
  limparEventosAtaque();
  atualizarBotoesDeEfeito();

  const displayTurno = document.querySelector("#turno-atual");
  const displayFase = document.querySelector("#fase-atual");

  if (displayTurno) {
    displayTurno.textContent = `Turno: ${turnState.numeroDoTurno}`;
  }
  if (displayFase) {
    displayFase.textContent = `Fase: ${turnState.fase.toUpperCase()} (${turnState.jogadorDaVez.nome})`;
  }

  logMensagem(`[Turno ${turnState.numeroDoTurno}] ${turnState.jogadorDaVez.nome} - Fase: ${turnState.fase}`);

  if (turnState.jogadorDaVez.ehIA) {
    executarTurnoIA(turnState.fase);
  } else {
    if (turnState.fase === "compra") {
      comprarCarta(jogador);
    } else if (turnState.fase === "batalha") {
      // Regra oficial do TCG: quem começa a partida não pode atacar no turno 1
      // (evita a vantagem injusta de já sair batendo antes do oponente jogar).
      if (turnState.numeroDoTurno === 1) {
        logMensagem("Não é permitido atacar no primeiro turno da partida.");
      } else {
        habilitarAtaqueJogador();
      }
    }
  }
}

// 1 monstro por turno (como o jogador), mas QUANTAS cartas de
// pensamentos a IA quiser, contanto que tenha carta e slot livre.
function iajogarcarta() {
    if (oponente.mao.length === 0) return;

    // 1) até 1 carta de ação (monstro) por turno
    if (turnState.invocacoesNesteTurno < 1) {
        const monstrosNaMao = oponente.mao.filter((c) => c.tipo === "action");
        const slotsMonstroLivres = oponente.campo.actions
            .map((c, i) => (c === null ? i : null))
            .filter((i) => i !== null);

        if (monstrosNaMao.length > 0 && slotsMonstroLivres.length > 0) {
            const melhorMonstro = [...monstrosNaMao].sort((a, b) => b.atk - a.atk)[0];
            colocarCartaNoCampo(oponente, melhorMonstro.id, "actions", slotsMonstroLivres[0]);
            turnState.invocacoesNesteTurno++;
        }
    }

    // 2) todas as cartas de pensamentos que couberem, sem limite de quantidade
    //    (recalcula mão/slots livres a cada volta do while, porque colocarCartaNoCampo
    //     tira a carta da mão e ocupa o slot, mudando os dois arrays a cada chamada)
    let pensamentosNaMao = oponente.mao.filter((c) => c.tipo === "pensamentos");
    let slotsPensamentoLivres = oponente.campo.pensamentos
        .map((c, i) => (c === null ? i : null))
        .filter((i) => i !== null);

    while (pensamentosNaMao.length > 0 && slotsPensamentoLivres.length > 0) {
        colocarCartaNoCampo(oponente, pensamentosNaMao[0].id, "pensamentos", slotsPensamentoLivres[0]);

        pensamentosNaMao = oponente.mao.filter((c) => c.tipo === "pensamentos");
        slotsPensamentoLivres = oponente.campo.pensamentos
            .map((c, i) => (c === null ? i : null))
            .filter((i) => i !== null);
    }
}

// NOVO: decide, carta por carta, se a IA deve ativar o efeito daquela carta
// AGORA (na sua fase Principal/Final), com base no estado da partida —
// vida da IA, vida do jogador e o que existe nos campos — em vez de usar
// os efeitos de forma aleatória ou nunca usá-los.
function deveAtivarEfeito(carta) {
    const jogadorTemMonstros = jogador.campo.actions.some((c) => c !== null);

    // Descanso (cura 1000 LP): só vale a pena quando a vida está baixa.
    // Sem essa checagem, a IA gastaria a cura assim que a carta caísse na
    // mão, mesmo estando com a vida cheia.
    if (carta.id.startsWith("DS-")) {
        return oponente.vidaPontos <= 2000;
    }

    // Aceitação / Ouvinte (efeitos defensivos, "armam" um escudo para o
    // PRÓXIMO ataque que a IA receber): só compensa ativar se o jogador
    // já tem monstros no campo capazes de atacar, e a vida da IA está
    // em risco o suficiente para justificar "gastar" a carta agora.
    if (carta.id.startsWith("AC-") || carta.id.startsWith("LT-")) {
        return jogadorTemMonstros && oponente.vidaPontos <= 2500;
    }

    // Sentido Aranha (também defensivo, mas com custo de 500 ATK): a IA só
    // paga esse custo se realmente existir uma ameaça no campo do jogador.
    if (carta.id.startsWith("SM-")) {
        return jogadorTemMonstros && oponente.vidaPontos <= 2500 && carta.atk >= 500;
    }

    // Kind (destrói uma carta de ação do oponente): só ativa se existir
    // alvo — sem isso o efeito falha e é desperdiçado (efeitoUsado = true
    // sem efeito nenhum).
    if (carta.id.startsWith("KD-")) {
        return jogadorTemMonstros;
    }

    // Calma (compra 1 carta): só quando a mão está ficando curta, para não
    // esvaziar o deck sem necessidade.
    if (carta.id.startsWith("CM-")) {
        return oponente.mao.length <= 2;
    }

    // Yami Yugi (rouba 100 LP do oponente para si): boa para fechar o jogo
    // quando a IA está atrás no placar de vida ou o jogador está por um fio.
    if (carta.id.startsWith("YG-")) {
        return oponente.vidaPontos < jogador.vidaPontos || jogador.vidaPontos <= 500;
    }

    return false;
}

// NOVO: percorre tudo que a IA tem no campo (monstros e pensamentos) e
// ativa o efeito de cada carta cujo deveAtivarEfeito() disser que vale a
// pena — reaproveitando o mesmo ativarEfeito() usado pelo botão do jogador.
function iaUsarEfeitos() {
    if (jogoTerminado) return;

    const cartasNoCampo = [
        ...oponente.campo.actions,
        ...oponente.campo.pensamentos
    ].filter((c) => c !== null && !c.efeitoUsado && EFEITOS[c.id]);

    cartasNoCampo.forEach((carta) => {
        if (deveAtivarEfeito(carta)) {
            ativarEfeito(oponente, carta);
        }
    });
}

function iaAtacar() {
    const atacantes = oponente.campo.actions.filter((c) => c !== null && !c.jaAtacou);

    atacantes.forEach((atacante) => {
        const defensores = jogador.campo.actions.filter((c) => c !== null);

        if (defensores.length === 0) {
            resolverAtaqueDireto(atacante, jogador);
        } else {
            const vulneraveis = defensores.filter((alvo) => atacante.atk > alvo.def);
            const alvo = vulneraveis.length > 0
                ? vulneraveis.sort((a, b) => a.def - b.def)[0]
                : defensores[0];
            resolverBatalha(atacante, alvo, jogador);
        }
        atacante.jaAtacou = true;
    });
}

function executarTurnoIA(fase) {
    if (jogoTerminado) return;
    switch (fase) {
        case "compra":
            comprarCarta(oponente);
            setTimeout(avancarFase, 1500);
            break;
        case "principal":
            iajogarcarta();
            iaUsarEfeitos(); // NOVO: depois de jogar cartas, decide quais efeitos ativar
            setTimeout(avancarFase, 1500);
            break;
        case "batalha":
            if (turnState.numeroDoTurno === 1) {
                logMensagem("A IA não pode atacar no primeiro turno da partida.");
            } else {
                iaAtacar();
            }
            setTimeout(avancarFase, 1500);
            break;
        case "final":
            iaUsarEfeitos(); // NOVO: última chance de ativar algo (ex: Descanso) antes de passar o turno
            setTimeout(avancarFase, 500);
            break;
        default:
            setTimeout(avancarFase, 1500);
    }
}

function avancarFase() {
    if (jogoTerminado) return;
    const indiceAtual = ORDEM_DE_FASES.indexOf(turnState.fase);
    if (indiceAtual === ORDEM_DE_FASES.length - 1) {
        passarTurno();
    } else {
        turnState.fase = ORDEM_DE_FASES[indiceAtual + 1];
        onNextPhase();
    }
}

function passarTurno() {
    turnState.jogadorDaVez = (turnState.jogadorDaVez === jogador) ? oponente : jogador;
    turnState.fase = "compra";
    turnState.numeroDoTurno++;
    turnState.invocacoesNesteTurno = 0;
    resetarAtaques(turnState.jogadorDaVez);
    onNextPhase();
}

function iniciarPartida() {
    jogador.deck = embaralharDeck(jogador.deck);
    oponente.deck = embaralharDeck(oponente.deck);

    comprarCartasSemRenderizar(jogador, 5);
    comprarCartasSemRenderizar(oponente, 5);
    renderhandOponent(oponente);

    turnState.jogadorDaVez = jogador;
    turnState.fase = "compra";
    atualizarHUD();
    atualizarDeckVisual();
    onNextPhase();
}

document.addEventListener("DOMContentLoaded", () => {
    iniciarPartida();

    document.querySelector("#next-phase-button").addEventListener("click", () => {
        if (jogoTerminado) return;
        if (turnState.jogadorDaVez.ehIA) return;
        avancarFase();
    });

    // NOVO: registra o hover no próprio painel de preview. Isso é o que
    // permite ao cursor "entrar" no preview (inclusive na área da barra de
    // rolagem) sem que ele seja escondido — porque, enquanto o mouse está
    // sobre #preview-carta, este listener cancela qualquer timeout de
    // esconder que tenha sido agendado pelo mouseleave da carta original.
    const preview = document.querySelector("#preview-carta");
    if (preview) {
        preview.addEventListener("mouseenter", () => clearTimeout(timeoutEsconderPreview));
        preview.addEventListener("mouseleave", () => agendarEsconderPreview());
    }

    // NOVO: liga os botões do popup de resultado (jogar novamente / sair).
    const botaoJogarNovamente = document.querySelector("#popup-jogar-novamente");
    if (botaoJogarNovamente) {
        botaoJogarNovamente.addEventListener("click", () => location.reload());
    }
    const botaoSair = document.querySelector("#popup-sair");
    if (botaoSair) {
        botaoSair.addEventListener("click", () => {
            window.location.href = "homepage.html";
        });
    }
});

function habilitarAtaqueJogador() {
    if (jogoTerminado) return;
    document.querySelectorAll("#jogador-monstros .field-slot.ocupado").forEach((slot) => {
        const numeroSlot = Number(slot.dataset.slot);
        const cartaAtacante = jogador.campo.actions[numeroSlot];

        if (!cartaAtacante || cartaAtacante.jaAtacou) return;

        slot.classList.add("pode-atacar");
        slot.style.cursor = "pointer";
        slot.onclick = () => selecionarAlvoEAtacar(cartaAtacante);
    });
}

function selecionarAlvoEAtacar(cartaAtacante) {
    const monstrosInimigos = oponente.campo.actions.filter((c) => c !== null);

    if (monstrosInimigos.length === 0) {
        resolverAtaqueDireto(cartaAtacante, oponente);
        cartaAtacante.jaAtacou = true;
        limparEventosAtaque();
        habilitarAtaqueJogador();
        return;
    }

    document.querySelectorAll("#oponente-monstros .field-slot.ocupado").forEach((slot) => {
        slot.classList.add("selecionavel");
        slot.onclick = () => {
            const numeroSlot = Number(slot.dataset.slot);
            const alvo = oponente.campo.actions[numeroSlot];

            resolverBatalha(cartaAtacante, alvo, oponente);
            cartaAtacante.jaAtacou = true;
            limparSelecaoAlvo();
            habilitarAtaqueJogador();
        };
    });
}

function limparSelecaoAlvo() {
    document.querySelectorAll("#oponente-monstros .field-slot").forEach((slot) => {
        slot.classList.remove("selecionavel");
        slot.onclick = null;
    });
}

// CORRIGIDA: agora aplica de fato "metade do dano" (em vez de anular o
// ataque inteiro) e usa o parâmetro certo (jogadorAlvo, não uma variável
// inexistente). Ver explicação detalhada na resposta sobre por que essa
// checagem saiu de resolverBatalha() e ficou só aqui.
function resolverAtaqueDireto(cartaAtacante, jogadorAlvo) {
    if (jogadorAlvo.escudoAtivo) {
        jogadorAlvo.escudoAtivo = false;
        logMensagem(`${jogadorAlvo.nome} usou seu escudo e anulou o ataque de ${cartaAtacante.nome}!`);
        return;
    }

    let danoFinal = cartaAtacante.atk;
    if (jogadorAlvo.reducaoDano) {
        jogadorAlvo.reducaoDano = false;
        danoFinal = Math.floor(danoFinal / 2);
        logMensagem(`${jogadorAlvo.nome} usou o efeito de Ouvinte: o dano deste ataque foi reduzido pela metade!`);
    }

    jogadorAlvo.vidaPontos = Math.max(0, jogadorAlvo.vidaPontos - danoFinal);
    atualizarHUD();
    logMensagem(`${cartaAtacante.nome} atacou diretamente! ${jogadorAlvo.nome} perdeu ${danoFinal} pontos de vida.`);
    verificarVitoria();
}

// CORRIGIDA: removido o bloco de reducaoDano que existia aqui — ele
// tratava um efeito de "reduzir dano" como se fosse anular o combate
// inteiro (comportamento errado) e ainda referenciava uma variável
// `jogadorDono` que não existe nesta função (isso geraria um
// ReferenceError e travaria o jogo assim que o efeito fosse usado antes
// de uma batalha entre monstros). Batalhas entre monstros não causam
// perda de LP neste jogo — só combate direto causa — então "reduzir o
// dano pela metade" só faz sentido dentro de resolverAtaqueDireto(),
// onde já está implementado corretamente acima.
function resolverBatalha(atacante, defensor, jogadorDefensor) {
    if (jogadorDefensor.escudoAtivo) {
        jogadorDefensor.escudoAtivo = false;
        logMensagem(`${jogadorDefensor.nome} usou seu escudo e anulou o ataque de ${atacante.nome}!`);
        return;
    }
    if (atacante.atk > defensor.def) {
        removerCartaDoCampo(jogadorDefensor, defensor.id);
        logMensagem(`${atacante.nome} (ATK ${atacante.atk}) destruiu ${defensor.nome} (DEF ${defensor.def})!`);
    } else if (atacante.atk < defensor.def) {
        logMensagem(`${defensor.nome} resistiu ao ataque de ${atacante.nome}.`);
    } else {
        logMensagem("As cartas têm o mesmo poder — nenhuma foi destruída.");
    }
}

function removerCartaDoCampo(jogadorDono, idCarta) {
    const indice = jogadorDono.campo.actions.findIndex((c) => c && c.id === idCarta);
    if (indice === -1) return;
    jogadorDono.campo.actions[indice] = null;

    const prefixo = jogadorDono.ehIA ? "oponente" : "jogador";
    const slot = document.querySelector(`#${prefixo}-monstros .field-slot[data-slot="${indice}"]`);
    if (slot) {
        slot.innerHTML = "";
        slot.classList.remove("ocupado");
    }
}

// CORRIGIDA: agora recebe o tipo de resultado ("vitoria" | "derrota" |
// "comboSagrado") e quem acionou (para o combo sagrado), e delega a
// exibição da mensagem central para mostrarPopupResultado().
function verificarVitoria() {
    if (jogador.vidaPontos <= 0) {
        logMensagem("Você perdeu! O oponente venceu a partida.");
        encerrarPartida("derrota");
    } else if (oponente.vidaPontos <= 0) {
        logMensagem("Você venceu a partida!");
        encerrarPartida("vitoria");
    }
}

// NOVO: checa se as 5 cartas do combo sagrado estão todas na mão do
// jogador informado. Chamada automaticamente sempre que uma mão é
// redesenhada (renderHand / renderhandOponent), então não é preciso
// lembrar de chamá-la manualmente em cada lugar que muda a mão.
function verificarComboSagrado(jogadorAlvo) {
    if (jogoTerminado) return;

    const idsNaMao = jogadorAlvo.mao.map((c) => c.id);
    const temComboCompleto = COMBO_SAGRADO_IDS.every((id) => idsNaMao.includes(id));

    if (temComboCompleto) {
        logMensagem(`${jogadorAlvo.nome} reuniu Vida, Verdade, Caminho, Luz e Verbo — vitória instantânea!`);
        encerrarPartida("comboSagrado", jogadorAlvo);
    }
}

// ATUALIZADA: agora recebe o tipo de resultado e (opcionalmente) quem
// acionou o combo sagrado, e chama mostrarPopupResultado() para exibir a
// mensagem central com os botões de jogar novamente / sair.
function encerrarPartida(tipo, jogadorQueAcionou = null) {
    if (jogoTerminado) return; // evita chamar o popup duas vezes
    jogoTerminado = true;
    limparEventosAtaque();
    limparSelecao();
    const botaoFase = document.querySelector("#next-phase-button");
    if (botaoFase) botaoFase.disabled = true;
    mostrarPopupResultado(tipo, jogadorQueAcionou);
}

// NOVO: monta a mensagem certa para cada tipo de fim de jogo e exibe o
// popup central (#popup-vitoria), que já existe no HTML mas até agora não
// tinha nenhuma lógica de JavaScript ligada a ele.
function mostrarPopupResultado(tipo, jogadorQueAcionou) {
    const popup = document.querySelector("#popup-vitoria");
    const texto = document.querySelector("#popup-vitoria-texto");
    if (!popup || !texto) return;

    let mensagem = "";

    if (tipo === "comboSagrado") {
        const nomeVencedor = jogadorQueAcionou === jogador ? "Você" : jogadorQueAcionou.nome;
        mensagem = `✨ COMBO SAGRADO! ✨\n${nomeVencedor} reuniu Vida, Verdade, Caminho, Luz e Verbo e venceu a partida instantaneamente!`;
    } else if (tipo === "vitoria") {
        mensagem = "Você venceu a partida!";
    } else if (tipo === "derrota") {
        mensagem = "Você perdeu! O oponente venceu a partida.";
    }

    texto.textContent = mensagem;
    popup.classList.add("visivel");
}

function limparEventosAtaque() {
    document.querySelectorAll(".field-slot").forEach((slot) => {
        slot.onclick = null;
        slot.style.cursor = "default";
        slot.classList.remove("pode-atacar");
    });
}

function atualizarHUD() {
    const vidaJog = document.querySelector("#vida-jogador");
    const vidaOp = document.querySelector("#vida-oponente");
    if (vidaJog) vidaJog.textContent = jogador.vidaPontos;
    if (vidaOp) vidaOp.textContent = oponente.vidaPontos;
}

function logMensagem(texto) {
  console.log(texto);
  const lista = document.querySelector("#log-lista");
  if (!lista) return;
  const item = document.createElement("li");
  item.textContent = texto;
  lista.appendChild(item);

  while (lista.children.length > 5) {
      lista.removeChild(lista.firstElementChild);
  }
  lista.scrollTop = lista.scrollHeight;
}

function atualizarDeckVisual() {
  const contadorJogador = document.querySelector("#jogador-deck-contador");
  const contadorOponente = document.querySelector("#oponente-deck-contador");
  if (contadorJogador) contadorJogador.textContent = jogador.deck.length;
  if (contadorOponente) contadorOponente.textContent = oponente.deck.length;
}

function resetarAtaques(jogadorAlvo) {
    jogadorAlvo.campo.actions.forEach((carta) => {
        if (carta) carta.jaAtacou = false;
    });
}

function atualizarBotoesDeEfeito() {
    const podeAtivar = turnState.jogadorDaVez === jogador
        && (turnState.fase === "principal" || turnState.fase === "final");

    document.querySelectorAll(".botao-efeito").forEach((botao) => {
        botao.style.display = podeAtivar ? "block" : "none";
    });
}

// ===== Funções de efeito individuais + tabela EFEITOS =====
// Ficam aqui (index.js), não em cards.js, porque cards.js carrega ANTES
// deste arquivo — se a tabela EFEITOS estivesse lá, essas funções ainda
// não existiriam no momento em que o objeto fosse montado.

function efeitoDestruirCartaInimiga(jogadorDono, carta) {
    const alvo = oponente.campo.actions.find((c) => c !== null);
    if (!alvo) {
        logMensagem("O oponente não tem cartas no campo para destruir.");
        return false; // efeito falhou: não deve ser marcado como "usado"
    }
    removerCartaDoCampo(oponente, alvo.id);
    logMensagem(`${carta.nome} ativou seu efeito e destruiu ${alvo.nome}!`);
    return true;
}

function efeitoNegarAtaqueInimigo(jogadorDono, carta) {
    jogadorDono.escudoAtivo = true;
    logMensagem(`${jogadorDono.nome} ativou ${carta.nome}: o próximo ataque recebido será anulado.`);
    return true;
}

function DescansoBao(jogadorDono, carta){
     jogadorDono.vidaPontos += 1000;
    atualizarHUD();
    logMensagem(`${jogadorDono.nome} ativou ${carta.nome}: foi restaurado 1000 de LP`);
    return true;
}

// CORRIGIDA: o parâmetro agora se chama `jogadorDono` (antes era
// `_JogadorDono`, com underscore, enquanto o corpo da função usava
// `jogadorDono` sem underscore — duas variáveis diferentes! Isso gerava
// um ReferenceError assim que essa função rodava, travando a ativação do
// efeito). Também trocamos `comprarCarta(jogador)` fixo por
// `comprarCarta(jogadorDono)`: antes, se a IA usasse essa carta, a compra
// ia para a mão do jogador humano por engano, em vez da própria IA.
function CalmaCaykeCalma(jogadorDono, carta){
    comprarCarta(jogadorDono);
    logMensagem(`${jogadorDono.nome} ativou ${carta.nome}: foi comprada uma carta`);
    return true;
}

function yugixd(jogadorDono, carta) {
    jogadorDono.vidaPontos += 100;
    oponente.vidaPontos = Math.max(0, oponente.vidaPontos - 100);

    atualizarHUD();
    logMensagem(`${jogadorDono.nome} ativou ${carta.nome}: PODE SIM!! ganhou 100 LP e o oponente perdeu 100 LP!`);
    verificarVitoria();

    return true;
}

function escute(jogadorDono, carta){
    jogadorDono.reducaoDano = true;
    logMensagem(`${jogadorDono.nome} ativou ${carta.nome}: o próximo ataque recebido terá o dano reduzido pela metade.`);
    return true;
}

// NOVO: efeito do Homem-Aranha ("Sentido Aranha"). Paga um custo de 500
// ATK (retirado permanentemente da própria carta, nesta partida) para
// armar um escudo que anula o próximo ataque recebido — reaproveitando o
// mesmo `escudoAtivo` já usado por "Aceitação".
function sentidoAranha(jogadorDono, carta) {
    const CUSTO_ATK = 500;

    if (carta.atk < CUSTO_ATK) {
        logMensagem(`${carta.nome} não tem ATK suficiente para pagar o custo do Sentido Aranha (${CUSTO_ATK}).`);
        return false;
    }

    carta.atk -= CUSTO_ATK;
    jogadorDono.escudoAtivo = true;

    // Redesenha o card no campo para refletir o novo ATK na tela.
    const indiceNoCampo = jogadorDono.campo.actions.findIndex((c) => c && c.id === carta.id);
    if (indiceNoCampo !== -1) {
        atualizarVisualDoSlot(jogadorDono, "actions", indiceNoCampo, carta);
    }

    logMensagem(`${jogadorDono.nome} ativou o Sentido Aranha de ${carta.nome}! Pagou ${CUSTO_ATK} de ATK (agora: ${carta.atk}) para anular o próximo ataque recebido.`);
    return true;
}

const EFEITOS = {
  "KD-001": efeitoDestruirCartaInimiga,
  "KD-002": efeitoDestruirCartaInimiga,
  "KD-003": efeitoDestruirCartaInimiga,
  "KD-004": efeitoDestruirCartaInimiga,
  "KD-005": efeitoDestruirCartaInimiga,
  "AC-001": efeitoNegarAtaqueInimigo,
  "AC-002": efeitoNegarAtaqueInimigo,
  "AC-003": efeitoNegarAtaqueInimigo,
  "AC-004": efeitoNegarAtaqueInimigo,
  "AC-005": efeitoNegarAtaqueInimigo,
  "DS-001": DescansoBao,
  "DS-002": DescansoBao,
  "DS-003": DescansoBao,
  "DS-004": DescansoBao,
  "CM-001": CalmaCaykeCalma,
  "CM-002": CalmaCaykeCalma,
  "CM-003": CalmaCaykeCalma,
  "YG-001": yugixd,
  "YG-002": yugixd,
  "YG-003": yugixd,
  // NOVO: mapeamentos que faltavam.
  "LT-001": escute,
  "LT-002": escute,
  "LT-003": escute,
  "LT-004": escute,
  "LT-005": escute,
  "LT-006": escute,
  "SM-001": sentidoAranha,
};

function ativarEfeito(jogadorDono, carta) {
    if (carta.efeitoUsado) {
        logMensagem(`${carta.nome} já usou seu efeito nesta partida.`);
        return;
    }

    const funcaoDoEfeito = EFEITOS[carta.id];
    if (!funcaoDoEfeito) {
        logMensagem(`${carta.nome} não tem um efeito programado ainda.`);
        return;
    }

    const sucesso = funcaoDoEfeito(jogadorDono, carta);
    if (!sucesso) return;

    carta.efeitoUsado = true;

    if (carta.tipo === "pensamentos") {
        const indice = jogadorDono.campo.pensamentos.findIndex((c) => c && c.id === carta.id);
        if (indice !== -1) {
            jogadorDono.campo.pensamentos[indice] = null;

            const prefixo = jogadorDono.ehIA ? "oponente" : "jogador";
            const slot = document.querySelector(`#${prefixo}-magias-armadilhas .field-slot[data-slot="${indice}"]`);
            if (slot) {
                slot.innerHTML = "";
                slot.classList.remove("ocupado");
            }
        }
    }

    atualizarBotoesDeEfeito();
}