


let deck = [cards_catalog];
let hand = [];
let campo = {
    actions: [null, null, null],
    pensamentos: [null, null, null],
};


function gerarCarta(carta){
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.dataset.id = carta.id;

    const statsHtml =  carta.tipo === "action"
      ?   `<div class="card-stats">
            <span class="atk">ATK/${carta.atk}</span>
            <span class="def">DEF/${carta.def}</span>
        </div>
    ` : "";
    const nivelHtml = carta.tipo === "action" 
    ? `<span class="card-nivel">${"★".repeat(carta.nivel)}</span>` : "";
    
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

let selectedCard = null;

function podeInvocar() {
    return turnState.jogadorDaVez === jogador && turnState.fase === "principal";
}

function putInCamp(idCarta){
    if (!podeInvocar()) {
        console.log("Só é possível colocar cartas na Fase Principal, no seu turno.");
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
            slot.addEventListener("click", onSlotClicado, {once:true});
        }
    });
}

function onSlotClicado(event){
    const slot = event.currentTarget;
    const linha = slot.closest(".field-row");
    const tipoLinha = linha.id === "jogador-monstros" ? "actions" : "pensamentos";
    const numeroSlot = Number(slot.dataset.slot);
    colocarCartaNoCampo(jogador, selectedCard, tipoLinha, numeroSlot);
    limparSelecao();
}

function colocarCartaNoCampo(jogadorDono, idCarta, tipoLinha, numeroSlot) {
  const indiceNaMao = jogadorDono.mao.findIndex((c) => c.id === idCarta);
  if (indiceNaMao === -1) return;

  const [carta] = jogadorDono.mao.splice(indiceNaMao, 1);
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
    deck: cards_catalog.map((carta) => ({ ...carta })), // cópia de cada carta, não a referência
    mao: [], // a mão começa vazia — as 5 cartas iniciais vêm de comprarCartasSemRenderizar()
    campo: {
      actions: [null, null, null, null, null],
      pensamentos: [null, null, null, null, null]
    }
  };
}

const jogador = criarJogador("Jogador", false);
const oponente = criarJogador("Próximo (IA)", true);

const turnState = {
  jogadorDaVez: null,   // referência para `jogador` ou `oponente`
  fase: "compra",
  numeroDoTurno: 1
};

const ORDEM_DE_FASES = ["compra", "principal", "batalha", "final"];

function onNextPhase() {
  limparSelecao();
  limparEventosAtaque();

  // Atualiza o indicador de turno e fase na tela
  const displayTurno = document.querySelector("#turno-atual");
  const displayFase = document.querySelector("#fase-atual");

  if (displayTurno) {
    displayTurno.textContent = `Turno: ${turnState.numeroDoTurno}`;
  }

  if (displayFase) {
    displayFase.textContent = `Fase: ${turnState.fase.toUpperCase()} (${turnState.jogadorDaVez.nome})`;
  }

  console.log(`[Turno ${turnState.numeroDoTurno}] ${turnState.jogadorDaVez.nome} - Fase: ${turnState.fase}`);

  if (turnState.jogadorDaVez.ehIA) {
    executarTurnoIA(turnState.fase);
  } else {
    if (turnState.fase === "compra") {
      comprarCarta(jogador);
    } else if (turnState.fase === "batalha") {
      habilitarAtaqueJogador();
    }
  }
}

function iajogarcarta() {
    const slotsLivres = oponente.campo.actions
        .map((carta, indice) => (carta === null ? indice : null))
        .filter((indice) => indice !== null);

    if (slotsLivres.length === 0 || oponente.mao.length === 0) return;

    const melhorCarta = [...oponente.mao].sort((a, b) => b.atk - a.atk)[0];
    colocarCartaNoCampo(oponente, melhorCarta.id, "actions", slotsLivres[0]);
}

function iaAtacar() {
    if (turnState.jaAtacouNesteTurno) return; // mesma regra vale para a IA

    const atacante = oponente.campo.actions.find((c) => c !== null);
    if (!atacante) return;

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
    turnState.jaAtacouNesteTurno = true;
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

function nextphase() {
    const indiceAtual = ORDEM_DE_FASES.indexOf(turnState.fase);
    const proximaFase = ORDEM_DE_FASES[(indiceAtual + 1) % ORDEM_DE_FASES.length];
    turnState.fase = proximaFase;
    console.log(`Fase atual: ${turnState.fase}`);
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
    atualizarHUD(); // novo
    onNextPhase();
}

document.addEventListener("DOMContentLoaded", () => {
    iniciarPartida();
    document.querySelector("#next-phase-button").addEventListener("click", () => {
        if (turnState.jogadorDaVez.ehIA) return;
        avancarFase();
    });
});

    //ia oponente

    function prepararAcoesJogador() {
    if (turnState.fase === "batalha") {
        habilitarAtaqueJogador();
    } else {
        limparEventosAtaque();
    }
}

function habilitarAtaqueJogador() {
    document.querySelectorAll("#jogador-monstros .field-slot.ocupado").forEach((slot) => {
        slot.style.cursor = "pointer";
        slot.onclick = () => {
            const numeroSlot = Number(slot.dataset.slot);
            const cartaAtacante = jogador.campo.actions[numeroSlot];
            if (cartaAtacante) {
                selecionarAlvoEAtacar(cartaAtacante);
            }
        };
    });
}

function selecionarAlvoEAtacar(cartaAtacante) {
    document.querySelectorAll("#oponente-monstros .field-slot").forEach((slot) => {
        slot.classList.add("selecionavel");
        slot.onclick = () => {
            const numeroSlot = Number(slot.dataset.slot);
            const alvo = oponente.campo.actions[numeroSlot];
            if (alvo) {
                resolverBatalha(cartaAtacante, alvo, oponente);
            } else {
                resolverAtaqueDireto(cartaAtacante, oponente);
            }
            limparSelecao();
            limparEventosAtaque();
        };
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
    });
}

function atualizarHUD() {
    const vidaJog = document.querySelector("#vida-jogador");
    const vidaOp = document.querySelector("#vida-oponente");
    if (vidaJog) vidaJog.textContent = jogador.vidaPontos;
    if (vidaOp) vidaOp.textContent = oponente.vidaPontos;
}

function logMensagem(texto) {
  console.log(texto); // mantemos no console também, útil para você debugar
  const lista = document.querySelector("#log-lista");
  if (!lista) return;
  const item = document.createElement("li");
  item.textContent = texto;
  lista.appendChild(item);
  lista.scrollTop = lista.scrollHeight; // rola a lista até a mensagem mais nova
}

function atualizarHUD() {
    const vidaJog = document.querySelector("#vida-jogador");
    const vidaOp = document.querySelector("#vida-oponente");
    if (vidaJog) vidaJog.textContent = jogador.vidaPontos;
    if (vidaOp) vidaOp.textContent = oponente.vidaPontos;
}

function atualizarDeckVisual() {
  const contadorJogador = document.querySelector("#jogador-deck-contador");
  const contadorOponente = document.querySelector("#oponente-deck-contador");
  if (contadorJogador) contadorJogador.textContent = jogador.deck.length;
  if (contadorOponente) contadorOponente.textContent = oponente.deck.length;
}