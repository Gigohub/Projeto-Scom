


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

function putInCamp(idCarta){
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
    deck: [...cards_catalog],
    mao: [cards_catalog[2]],
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
                resolverBatalha(cartaAtacante, alvo);
            } else {
                resolverAtaqueDireto(cartaAtacante, oponente);
            }
            limparSelecao();
            limparEventosAtaque();
        };
    });
}

function resolverAtaqueDireto(cartaAtacante, jogadorAlvo) {
    jogadorAlvo.vidaPontos -= cartaAtacante.atk;
    console.log(`${cartaAtacante.nome} atacou diretamente! Vida de ${jogadorAlvo.nome}: ${jogadorAlvo.vidaPontos}`);
}

function resolverBatalha(atacante, defensor) {
    if (atacante.atk > defensor.def) {
        console.log(`${atacante.nome} destruiu ${defensor.nome}!`);
    } else {
        console.log(`${defensor.nome} defendeu o ataque.`);
    }
}

function limparEventosAtaque() {
    document.querySelectorAll(".field-slot").forEach((slot) => {
        slot.onclick = null;
        slot.style.cursor = "default";
    });
}