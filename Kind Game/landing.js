/* ==========================================================================
   Kind Game – Landing page
   Duas funcionalidades independentes:
   1. Destacar no menu a seção que o usuário está vendo (aria-current)
   2. Filtrar as cartas da enciclopédia por nome e por tipo
   O script é carregado com "defer": roda depois que o HTML foi lido,
   então os elementos já existem quando procuramos por eles.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. MENU: indicar a seção atual
     ------------------------------------------------------------------------ */
  function iniciarMenuAtivo() {
    const links = Array.from(document.querySelectorAll('.menu a[href^="#"]'));
    if (links.length === 0) return;

    // Cada link aponta para uma seção (ex.: href="#tutorial" -> <section id="tutorial">)
    const itens = links
      .map(function (link) {
        return { link: link, secao: document.querySelector(link.getAttribute('href')) };
      })
      .filter(function (item) {
        return item.secao !== null;
      });

    function atualizar() {
      // "Linha de leitura": um ponto a 35% da altura da janela.
      // A seção atual é a última cuja parte de cima já passou por essa linha.
      const linha = window.innerHeight * 0.35;
      let atual = itens[0]; // por padrão, "Início"

      itens.forEach(function (item) {
        if (item.secao.getBoundingClientRect().top <= linha) {
          atual = item;
        }
      });

      // Se chegou ao fim da página, a última seção do menu vira a atual
      const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (noFim) {
        atual = itens[itens.length - 1];
      }

      itens.forEach(function (item) {
        if (item === atual) {
          item.link.setAttribute('aria-current', 'location');
        } else {
          item.link.removeAttribute('aria-current');
        }
      });
    }

    // requestAnimationFrame evita recalcular a cada pixel rolado
    let agendado = false;
    function aoRolar() {
      if (agendado) return;
      agendado = true;
      window.requestAnimationFrame(function () {
        atualizar();
        agendado = false;
      });
    }

    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    atualizar();
  }

  /* ------------------------------------------------------------------------
     2. ENCICLOPÉDIA: filtro por nome e tipo
     ------------------------------------------------------------------------ */
  function iniciarFiltroDeCartas() {
    const form = document.getElementById('filtros');
    const campoBusca = document.getElementById('busca-carta');
    const resultado = document.getElementById('resultado-filtro');
    const cartas = Array.from(document.querySelectorAll('#lista-cartas .carta'));
    if (!form || !campoBusca || !resultado || cartas.length === 0) return;

    const botoes = Array.from(form.querySelectorAll('[data-filtro]'));
    let tipoAtivo = 'todas';

    // Remove acentos e maiúsculas: "Dragão" e "dragao" passam a ser iguais
    function normalizar(texto) {
      return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function aplicarFiltro() {
      const termo = normalizar(campoBusca.value.trim());
      let visiveis = 0;

      cartas.forEach(function (carta) {
        const nome = normalizar(carta.querySelector('.carta__nome').textContent);
        const bateTipo = tipoAtivo === 'todas' || carta.dataset.tipo === tipoAtivo;
        const bateNome = nome.includes(termo);
        const mostrar = bateTipo && bateNome;

        carta.hidden = !mostrar;
        if (mostrar) visiveis += 1;
      });

      // role="status" no HTML faz leitores de tela anunciarem esta frase
      if (visiveis === 0) {
        resultado.textContent = 'Nenhuma carta encontrada.';
      } else if (visiveis === 1) {
        resultado.textContent = '1 carta encontrada.';
      } else {
        resultado.textContent = visiveis + ' cartas encontradas.';
      }
    }

    botoes.forEach(function (botao) {
      botao.addEventListener('click', function () {
        tipoAtivo = botao.dataset.filtro;
        botoes.forEach(function (outro) {
          outro.setAttribute('aria-pressed', String(outro === botao));
        });
        aplicarFiltro();
      });
    });

    campoBusca.addEventListener('input', aplicarFiltro);

    // Enter dentro do campo de busca enviaria o formulário e recarregaria a página
    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
    });

    form.hidden = false; // o filtro só aparece quando o JavaScript está funcionando
    aplicarFiltro();
  }

  iniciarMenuAtivo();
  iniciarFiltroDeCartas();
})();