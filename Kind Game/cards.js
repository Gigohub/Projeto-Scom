const cards_catalog = [
    { id: "KD-001", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-002", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-003", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-004", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-005", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-006", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-007", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-008", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-009", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-010", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2500, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "AC-001", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/soniccard.jpg" },
    { id: "AC-002", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/soniccard.jpg" },
    { id: "AC-003", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/soniccard.jpg" },
    { id: "AC-004", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/soniccard.jpg" },
    { id: "AC-005", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/soniccard.jpg" },
    { id: "AC-006", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/soniccard.jpg" },
    { id: "AC-007", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/soniccard.jpg" },
    { id: "AC-008", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/soniccard.jpg" }

];

// A tabela EFEITOS e as funções de efeito (efeitoDestruirCartaInimiga,
// efeitoNegarAtaqueInimigo) foram movidas para o index.js.
// Motivo: aqui em cards.js, essas funções ainda não existiam no momento
// em que este arquivo era executado (cards.js carrega ANTES de index.js),
// então referenciá-las aqui sempre vai gerar ReferenceError e travar
// a execução deste script no meio do arquivo.