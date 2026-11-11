// Lógica da página inicial (homepage.html) - Filtros e busca da Enciclopédia de Cartas

document.addEventListener("DOMContentLoaded", () => {
    const formularioFiltros = document.querySelector("#filtros");
    const campoBusca = document.querySelector("#busca-carta");
    const botoesFiltro = document.querySelectorAll(".botao--filtro");
    const listaCartas = document.querySelector("#lista-cartas");
    const resultadoFiltro = document.querySelector("#resultado-filtro");

    if (!listaCartas) return;

    // Torna a barra de filtros visível agora que o JS foi carregado
    if (formularioFiltros) {
        formularioFiltros.removeAttribute("hidden");
    }

    const cartas = Array.from(listaCartas.querySelectorAll(".carta"));
    let filtroTipoAtual = "todas";

    function aplicarFiltros() {
        const termoBusca = (campoBusca ? campoBusca.value : "").trim().toLowerCase();
        let visiveis = 0;

        cartas.forEach((carta) => {
            const tipoCarta = (carta.dataset.tipo || "").toLowerCase();
            const nomeCarta = (carta.querySelector(".carta__nome")?.textContent || "").toLowerCase();

            const bateuTipo = filtroTipoAtual === "todas" || tipoCarta === filtroTipoAtual.toLowerCase();
            const bateuBusca = !termoBusca || nomeCarta.includes(termoBusca);

            if (bateuTipo && bateuBusca) {
                carta.style.display = "";
                visiveis++;
            } else {
                carta.style.display = "none";
            }
        });

        if (resultadoFiltro) {
            if (visiveis === cartas.length) {
                resultadoFiltro.textContent = `Exibindo todas as ${cartas.length} cartas.`;
            } else if (visiveis === 0) {
                resultadoFiltro.textContent = "Nenhuma carta encontrada com esses filtros.";
            } else {
                resultadoFiltro.textContent = `Exibindo ${visiveis} de ${cartas.length} cartas.`;
            }
        }
    }

    // Eventos dos botões de filtro por tipo (Todas / Action / thoughts)
    botoesFiltro.forEach((botao) => {
        botao.addEventListener("click", () => {
            botoesFiltro.forEach((b) => b.setAttribute("aria-pressed", "false"));
            botao.setAttribute("aria-pressed", "true");
            filtroTipoAtual = botao.dataset.filtro || "todas";
            aplicarFiltros();
        });
    });

    // Evento de busca por texto
    if (campoBusca) {
        campoBusca.addEventListener("input", aplicarFiltros);
    }

    // Evita o recarregamento ao dar Enter na busca
    if (formularioFiltros) {
        formularioFiltros.addEventListener("submit", (e) => e.preventDefault());
    }

    // Contagem inicial ao carregar a página
    aplicarFiltros();
});