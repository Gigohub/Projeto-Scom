function montarDeck(deckIds) {
  deck = deckIds
    .map((id) => {
      const cartaOriginal = cards_catalog.find((c) => c.id === id);
      if (!cartaOriginal) {
        console.warn(`Carta com ID ${id} não encontrada no catálogo.`);
        return null;
      }
      return { ...cartaOriginal };
    })
    .filter((carta) => carta !== null);
}

function embaralharDeck(deckAtual) {
  const copia = [...deckAtual];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia; // fora do loop!
}

function embaralharDeck(deckAtual) {
  const copia = [...deckAtual];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function comprarCarta(jogadorAlvo) {
  if (jogadorAlvo.deck.length === 0) {
    console.warn(`${jogadorAlvo.nome} não tem mais cartas no deck.`);
    return null;
  }
  const cartaComprada = jogadorAlvo.deck.pop();
  jogadorAlvo.mao.push(cartaComprada);
  if (!jogadorAlvo.ehIA) renderHand(jogadorAlvo);
  return cartaComprada;
}

function comprarCartasSemRenderizar(jogadorAlvo, quantidade) {
  for (let i = 0; i < quantidade; i++) {
    if (jogadorAlvo.deck.length === 0) break;
    jogadorAlvo.mao.push(jogadorAlvo.deck.pop());
  }
  if (!jogadorAlvo.ehIA) renderHand(jogadorAlvo);
}

function iniciarPartida() {
  const idsDoMeuDeck = cards_catalog.map((c) => c.id); // por enquanto, usa todo o catálogo
  montarDeck(idsDoMeuDeck);
  deck = embaralharDeck(deck);
  comprarCartasSemRenderizar(5);
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarPartida();
});