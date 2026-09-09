


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

function renderHand(){
    const container = document.querySelector(".hand-container");
    container.innerHTML = ""; // Limpa o conteúdo anterior

    hand.forEach((carta) => {
        const cardElement = gerarCarta(carta);
        cardElement.addEventListener("click", () => {
            // Aqui você pode adicionar a lógica para o que acontece quando a carta é clicada
            cardElement.addEventListener("click", () => {
    putInCamp(carta.id);
});
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
    const carta = hand.find((c) => c.id === idCarta);
    if (!carta) return;
    selectedCard = idCarta;
    freeSlots(carta.tipo);
}

function freeSlots(tipoCarta){
    const linhaId = tipoCarta === "action" ? "linha-actions" : "linha-pensamentos";
    document.querySelectorAll(`#${linhaId} .field-slot`).forEach((slot) => {
        if (!slot.classList.contains("ocupado")) {
            slot.classList.add("selecionavel");
            slot.addEventListener("click", onSlotClicado, {once:true});
        }
    });
}

function onSlotClicado(event){
    const slot = event.currentTarget;
    colocarCartaNoSlot(selectedCard, slot);
    limparSelecao();
}

function colocarCartaNoSlot(idCarta, slot){
    const indiceNaMao = hand.findIndex((c) => c.id === idCarta);
    if (indiceNaMao === -1) return;

    const [carta] = hand.splice(indiceNaMao, 1);
    const numeroSlot = Number(slot.dataset.slot);

    if (carta.tipo === "action") {
        campo.actions[numeroSlot] = carta;
    } else {
        campo.pensamentos[numeroSlot] = carta;
    }

    slot.classList.add("ocupado"); // novo
    renderHand();
}

function limparSelecao(){
    selectedCard = null;
    document.querySelectorAll(".field-slot").forEach((slot) => {
        slot.classList.remove("selecionavel");
    });
}

function NewPlayer(nome, ehIA = false) {
  return {
    nome: nome,
    ehIA: ehIA,
    vidaPontos: 4000,
    deck: [],
    mao: [],
    campo: {
      monstros: [null, null, null, null, null],
      magiasArmadilhas: [null, null, null, null, null]
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

function nextphase() {
    const indiceAtual = ORDEM_DE_FASES.indexOf(turnState.fase);
    const proximaFase = ORDEM_DE_FASES[(indiceAtual + 1) % ORDEM_DE_FASES.length];
    turnState.fase = proximaFase;
    console.log(`Fase atual: ${turnState.fase}`);
}

    if (próximafase()) {
        turnstate.fase = "proximaFase";
    } else {
        passarTurno(); //chegou ao final da fase, passa para o próximo jogador
    }

    onEntrarNaFase(turnState.fase);
}

    function onNextPhase() {
        atualizarIndicadOorDeFase(fase);
        
        if (fase === "compra") {
            comprarCarta(estadoTurno.jogadorDaVez);

        }

        if (estadoturno.NewPlayerDaVez.ehIA) {
            executarTurnoIA();
        }

    }