let selectedCard = null;
let jogoTerminado = false; // NOVO: trava o jogo assim que alguém perde


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
    // Ao tirar o mouse, esconde o preview de novo.
    cardDiv.addEventListener("mouseenter", () => mostrarPreview(carta));
    cardDiv.addEventListener("mouseleave", () => esconderPreview());

    return cardDiv;
}

// Preenche a caixa #preview-carta (na barra lateral) com uma versão
// ampliada da carta. Reaproveita construirMarkupCarta() para não duplicar
// a montagem do HTML — só muda o tamanho, via CSS (#preview-carta é maior
// que .card no tabuleiro).
function mostrarPreview(carta) {
    const preview = document.querySelector("#preview-carta");
    if (!preview) return;
    preview.innerHTML = construirMarkupCarta(carta);
    preview.classList.add("visivel");
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
    escudoAtivo: false, // NOVO: usado pelo efeito "Aceitação" (nega o próximo ataque)
    reducaoDano: false, //para o efeito escute
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

function onNextPhase() {
  if (jogoTerminado) return; // NOVO: nenhuma fase avança depois do fim de jogo

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

// ===== CORRIGIDA: 1 monstro por turno (como o jogador), mas QUANTAS
// cartas de pensamentos a IA quiser, contanto que tenha carta e slot livre =====
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

// ===== CORRIGIDA: agora checa o escudo do efeito "Aceitação" antes de aplicar dano =====
function resolverAtaqueDireto(cartaAtacante, jogadorAlvo) {
    if (jogadorAlvo.escudoAtivo) {
        jogadorAlvo.escudoAtivo = false;
        logMensagem(`${jogadorAlvo.nome} usou seu escudo e anulou o ataque de ${cartaAtacante.nome}!`);
        return;
    }
    jogadorAlvo.vidaPontos = Math.max(0, jogadorAlvo.vidaPontos - cartaAtacante.atk);
    atualizarHUD();
    logMensagem(`${cartaAtacante.nome} atacou diretamente! ${jogadorAlvo.nome} perdeu ${cartaAtacante.atk} pontos de vida.`);
    verificarVitoria();
}

function resolverBatalha(atacante, defensor, jogadorDefensor) {
    if (jogadorDefensor.escudoAtivo) {
        jogadorDefensor.escudoAtivo = false;
        logMensagem(`${jogadorDefensor.nome} usou seu escudo e anulou o ataque de ${atacante.nome}!`);
        return;
    }
    if (jogadorDefensor.reducaoDano){
        jogadorDefensor.reducaoDano = false;
         logMensagem(`${jogadorDono.nome} escutou ${atacante.nome}. o próximo ataque recebido será reduzido.`);
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

// ===== CORRIGIDA: agora trava o jogo de verdade =====
function verificarVitoria() {
    if (jogador.vidaPontos <= 0) {
        logMensagem("Você perdeu! O oponente venceu a partida.");
        encerrarPartida();
    } else if (oponente.vidaPontos <= 0) {
        logMensagem("Você venceu a partida!");
        encerrarPartida();
    }
}

function encerrarPartida() {
    jogoTerminado = true;
    limparEventosAtaque();
    limparSelecao();
    const botaoFase = document.querySelector("#next-phase-button");
    if (botaoFase) botaoFase.disabled = true;
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

// ===== CORRIGIDA: mantém só as 5 mensagens mais recentes =====
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

// ===== NOVO: funções de efeito individuais + tabela EFEITOS =====
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

function CalmaCaykeCalma(_JogadorDono, carta){
    comprarCarta(jogador);
    logMensagem(`${jogadorDono.nome} ativou ${carta.nome}: foi comprado uma carta`);
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
    logMensagem(`${jogadorDono.nome} ativou ${carta.nome}: o próximo ataque recebido será anulado.`);
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
};

// ===== CORRIGIDA: agora consulta a tabela EFEITOS em vez de um if fixo =====
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