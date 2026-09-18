const cards_catalog = [
    { id: "KD-001", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2000, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-002", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2000, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-003", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2000, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-004", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2000, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "KD-005", nome: "Kind", tipo: "action", nivel: 5, atk: 3000, def: 2000, efeito: "pode escolher uma carta de action do oponente e destrui-la", imagem: "images/kind.jpg" },
    { id: "LT-001", nome:"escutar", tipo:"action", nivel: 3, atk: 1500, def: 600, efeito: "reduz o dano do proximo ataque pela metade", imagem: "images/escutar.webp" },
    { id: "LT-002", nome:"escutar", tipo:"action", nivel: 3, atk: 1500, def: 600, efeito: "reduz o dano do proximo ataque pela metade", imagem: "images/escutar.webp" },
    { id: "LT-003", nome:"escutar", tipo:"action", nivel: 3, atk: 1500, def: 600, efeito: "reduz o dano do proximo ataque pela metade", imagem: "images/escutar.webp" },
    { id: "LT-004", nome:"escutar", tipo:"action", nivel: 3, atk: 1500, def: 600, efeito: "reduz o dano do proximo ataque pela metade", imagem: "images/escutar.webp" },
    { id: "LT-005", nome:"escutar", tipo:"action", nivel: 3, atk: 1500, def: 600, efeito: "reduz o dano do proximo ataque pela metade", imagem: "images/escutar.webp" },
    { id: "LT-006", nome:"escutar", tipo:"action", nivel: 3, atk: 1500, def: 600, efeito: "reduz o dano do proximo ataque pela metade", imagem: "images/escutar.webp" },
    { id: "HG-001", nome:"abraço", tipo:"action", nivel: 4, atk: 2100, def:1200, imagem: "images/abraco.jpg"},
    { id: "HG-002", nome:"abraço", tipo:"action", nivel: 4, atk: 2100, def:1200, imagem: "images/abraco.jpg"},
    { id: "HG-003", nome:"abraço", tipo:"action", nivel: 4, atk: 2100, def:1200, imagem: "images/abraco.jpg"},
    { id: "HG-004", nome:"abraço", tipo:"action", nivel: 4, atk: 2100, def:1200, imagem: "images/abraco.jpg"},
    { id: "SN-001", nome: "Sonic The Hedhehog", tipo: "action", nivel: 5, atk: 3000, def: 2000, imagem:"images/soniccard.jpg"},
    { id: "SN-002", nome: "Sonic The Hedhehog", tipo: "action", nivel: 5, atk: 3000, def: 2000, imagem:"images/soniccard.jpg"},
    { id: "AC-001", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/aceitacao.webp" },
    { id: "AC-002", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/aceitacao.webp" },
    { id: "AC-003", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/aceitacao.webp" },
    { id: "AC-004", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/aceitacao.webp" },
    { id: "AC-005", nome: "Aceitação", tipo: "pensamentos", efeito: "nega um ataque inimigo", imagem: "images/aceitacao.webp" },
    { id: "DS-001", nome: "Descanso", tipo: "pensamentos", efeito: "recupera 1000 LP", imagem: "images/descanso.jpg"},
    { id: "DS-002", nome: "Descanso", tipo: "pensamentos", efeito: "recupera 1000 LP", imagem: "images/descanso.jpg"},
    { id: "DS-003", nome: "Descanso", tipo: "pensamentos", efeito: "recupera 1000 LP", imagem: "images/descanso.jpg"},
    { id: "DS-003", nome: "Descanso", tipo: "pensamentos", efeito: "recupera 1000 LP", imagem: "images/descanso.jpg"},
    { id: "CM-001", nome: "calma", tipo: "pensamentos", efeito: "puxa uma carta do seu deck", imagem:"images/calma.jpg"},
    { id: "CM-002", nome: "calma", tipo: "pensamentos", efeito: "puxa uma carta do seu deck", imagem:"images/calma.jpg"},
    { id: "CM-003", nome: "calma", tipo: "pensamentos", efeito: "puxa uma carta do seu deck", imagem:"images/calma.jpg"}
    

];

// A tabela EFEITOS e as funções de efeito (efeitoDestruirCartaInimiga,
// efeitoNegarAtaqueInimigo) foram movidas para o index.js.
// Motivo: aqui em cards.js, essas funções ainda não existiam no momento
// em que este arquivo era executado (cards.js carrega ANTES de index.js),
// então referenciá-las aqui sempre vai gerar ReferenceError e travar
// a execução deste script no meio do arquivo.