let selectedCard = null;

function gerarCarta(carta){
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.dataset.id = carta.id;

    const statsHtml = carta.tipo === "action"
      ? `<div class="card-stats">
            <span class="atk">ATK/${carta.atk}</span>
            <span class="def">DEF/${carta.def}</span>
        </div>`
      : "";
    const nivelHtml = carta.tipo === "action"
        ? `<span class="card-nivel">${"★".repeat(carta.nivel)}</span>`
        : "";

    cardDiv.innerHTML = `
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

  return cardDiv;
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
}

function renderhandOponent(oponente) {
  const container = document.querySelector(".oponente-hand");
  container.innerHTML = "";

  oponente.mao.forEach(() => {
    const costas = document.createElement("div");
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
}

function podeInvocar() {
    return turnState.jogadorDaVez === jogador
        && turnState.fase === "principal"
        && turnState.invocacoesNesteTurno < 1;
}

function putInCamp(idCarta){
    if (!podeInvocar()) {
        logMensagem("Só é possível colocar cartas na Fase Principal, no seu turno.");
        return;
    }
    const carta = jogador.mao.find((c) => c.id === idCarta);
    if (!carta) return;
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
    turnState.invocacoesNesteTurno++;

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

const turnState = {
  jogadorDaVez: null,
  fase: "compra",
  numeroDoTurno: 1,
  invocacoesNesteTurno: 0
};

const ORDEM_DE_FASES = ["compra", "principal", "batalha", "final"];

// ===== ESTA É A FUNÇÃO QUE ESTAVA QUEBRADA =====
// Antes, o "}" de fechamento vinha cedo demais, e todo o código abaixo
// rodava sozinho, fora da função, assim que o script carregava.
function onNextPhase() {
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
      habilitarAtaqueJogador();
    }
  }
} // <- fechamento correto, tudo que precisa rodar A CADA fase fica DENTRO

function iajogarcarta() {
    if (turnState.invocacoesNesteTurno >= 1) return;

    const slotsLivres = oponente.campo.actions
        .map((carta, indice) => (carta === null ? indice : null))
        .filter((indice) => indice !== null);

    if (slotsLivres.length === 0 || oponente.mao.length === 0) return;

    const melhorCarta = [...oponente.mao].sort((a, b) => b.atk - a.atk)[0];
    colocarCartaNoCampo(oponente, melhorCarta.id, "actions", slotsLivres[0]);
    turnState.invocacoesNesteTurno++;
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
    switch (fase) {
        case "compra":
            comprarCarta(oponente);
            setTimeout(avancarFase, 800);
            break;
        case "principal":
            iajogarcarta();
            setTimeout(avancarFase, 800);
            break;
        case "batalha":
            iaAtacar();
            setTimeout(avancarFase, 800);
            break;
        case "final":
            setTimeout(avancarFase, 500);
            break;
        default:
            setTimeout(avancarFase, 500);
    }
}

function avancarFase() {
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
        if (turnState.jogadorDaVez.ehIA) return;
        avancarFase();
    });
});

function habilitarAtaqueJogador() {
    document.querySelectorAll("#jogador-monstros .field-slot.ocupado").forEach((slot) => {
        const numeroSlot = Number(slot.dataset.slot);
        const cartaAtacante = jogador.campo.actions[numeroSlot];

        if (!cartaAtacante || cartaAtacante.jaAtacou) return;

        slot.classList.add("pode-atacar");
        slot.style.cursor = "pointer";
        slot.onclick = () => selecionarAlvoEAtacar(cartaAtacante);
    });
}

// ===== VERSÃO ÚNICA E CORRIGIDA (a duplicata antiga foi removida) =====
function selecionarAlvoEAtacar(cartaAtacante) {
    const monstrosInimigos = oponente.campo.actions.filter((c) => c !== null);

    // Campo do oponente vazio: ataque direto acontece na hora, sem escolher alvo
    if (monstrosInimigos.length === 0) {
        resolverAtaqueDireto(cartaAtacante, oponente);
        cartaAtacante.jaAtacou = true;
        limparEventosAtaque();
        habilitarAtaqueJogador();
        return;
    }

    // Existem monstros: OBRIGATÓRIO escolher um deles, só slots ocupados ficam clicáveis
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

function resolverAtaqueDireto(cartaAtacante, jogadorAlvo) {
    jogadorAlvo.vidaPontos = Math.max(0, jogadorAlvo.vidaPontos - cartaAtacante.atk);
    atualizarHUD();
    logMensagem(`${cartaAtacante.nome} atacou diretamente! ${jogadorAlvo.nome} perdeu ${cartaAtacante.atk} pontos de vida.`);
    verificarVitoria();
}

function resolverBatalha(atacante, defensor, jogadorDefensor) {
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

function verificarVitoria() {
    if (jogador.vidaPontos <= 0) {
        logMensagem("Você perdeu! O oponente venceu a partida.");
    } else if (oponente.vidaPontos <= 0) {
        logMensagem("Você venceu a partida!");
    }
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

function ativarEfeito(jogadorDono, carta) {
    if (carta.efeitoUsado) {
        logMensagem(`${carta.nome} já usou seu efeito nesta partida.`);
        return;
    }

    if (carta.id.startsWith("KD-")) {
        const alvo = oponente.campo.actions.find((c) => c !== null);
        if (!alvo) {
            logMensagem("O oponente não tem cartas no campo para destruir.");
            return;
        }
        removerCartaDoCampo(oponente, alvo.id);
        logMensagem(`${carta.nome} ativou seu efeito e destruiu ${alvo.nome}!`);
        carta.efeitoUsado = true;
    }
}