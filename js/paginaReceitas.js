/* ======================================================
   REAPROVEIT.AI - PÁGINA DE RECEITAS
====================================================== */

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const API_URL = "http://localhost:3000/api";

// ======================================================
// ELEMENTOS DA PÁGINA
// ======================================================

const cards = document.querySelectorAll(".ingredient-card");

const placeholder = document.getElementById("placeholder");
const recipesContent = document.getElementById("recipesContent");
const recipesArea = document.querySelector(".recipes-area");

const selectedIngredient = document.getElementById("selectedIngredient");
let clearSelectedIngredientsButton = null;

const recipeList = document.getElementById("recipeList");
const closeRecipes = document.getElementById("closeRecipes");
const contador = document.getElementById("contador");

let ingredientesSelecionados = [];

let ultimaRespostaIA = [];
let ultimaRespostaBanco = [];

let modoAtual = "";

// ======================================================
// CONTADOR
// ======================================================

if (contador) {
    contador.textContent = `${cards.length} alimentos`;
}

// ======================================================
// SEGURANÇA HTML
// ======================================================

function escaparHTML(valor) {

    return String(valor ?? "").replace(/[&<>"']/g, caractere => {

        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entidades[caractere];
    });
}

// ======================================================
// CRIAR CONTROLES DA ÁREA DE INGREDIENTES
// ======================================================

function criarControlesReceitas() {

    if (!recipesContent || !recipeList) return;

    if (document.getElementById("recipeActions")) return;

    const controles = document.createElement("div");

    controles.id = "recipeActions";
    controles.className = "recipe-actions";

    controles.innerHTML = `

        <div class="selection-summary" id="selectionSummary">
            Nenhum ingrediente selecionado.
        </div>

        <button
            type="button"
            id="generateAIButton"
            class="generate-ai-button"
            disabled
        >
             Gerar receitas com IA
        </button>

    `;

    const ingredientsLeft = document.querySelector(".ingredients-left");

    if (ingredientsLeft) {
        ingredientsLeft.appendChild(controles);
    }

    document
        .getElementById("generateAIButton")
        .addEventListener("click", gerarReceitasIA);
}

// ======================================================
// CRIAR BOTÃO DA ÁREA DE RESULTADOS
// ======================================================

function criarBotaoBanco() {

    if (!recipesContent) return;

    if (document.getElementById("resultsActions")) return;

    const controles = document.createElement("div");

    controles.id = "resultsActions";
    controles.className = "results-actions";

    controles.innerHTML = `

        <button
            type="button"
            id="searchDatabaseButton"
            class="search-database-button"
        >
            Ver receitas cadastradas
        </button>

    `;

    recipesContent.appendChild(controles);

    document
        .getElementById("searchDatabaseButton")
        .addEventListener("click", buscarReceitasBanco);
}

criarControlesReceitas();
criarBotaoBanco();

// ======================================================
// ABRIR ÁREA DE RESULTADOS
// ======================================================

function abrirPainel() {

    if (placeholder) {
        placeholder.style.display = "none";
    }

    if (recipesContent) {
        recipesContent.classList.add("active");
        recipesContent.style.display = "";
    }

    if (recipesArea) {
        recipesArea.classList.add("visible");
    }

    atualizarControles();
}

// ======================================================
// ROLAR ATÉ OS RESULTADOS
// ======================================================

function rolarParaResultados() {

    if (!recipesArea) return;

    setTimeout(() => {

        recipesArea.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 180);
}

// ======================================================
// SELECIONAR INGREDIENTES
// ======================================================

cards.forEach(card => {

    card.addEventListener("click", () => {

        const nome = card.dataset.name;
        const id = card.dataset.id;

        if (!nome || !id) {
            console.error("Ingrediente sem nome ou ID:", card);
            return;
        }

        const jaSelecionado = card.classList.contains("selected");

        if (jaSelecionado) {

            card.classList.remove("selected");

            card.setAttribute("aria-pressed", "false");

            ingredientesSelecionados =
                ingredientesSelecionados.filter(item => item.id !== id);

        } else {

            card.classList.add("selected");

            card.setAttribute("aria-pressed", "true");

            ingredientesSelecionados.push({
                id,
                nome
            });
        }

        console.log(
            "Ingredientes selecionados:",
            ingredientesSelecionados
        );

        atualizarControles();
        atualizarTitulo();

        mostrarBotaoLimparSelecao(false);

        ultimaRespostaIA = [];
        ultimaRespostaBanco = [];
        modoAtual = "";

        if (recipeList) {

            recipeList.innerHTML = `

                <div class="selection-message">

                    <h3>Ingredientes selecionados!</h3>

                    <p>
                        Agora você pode gerar receitas com inteligência artificial
                        ou consultar as receitas cadastradas no Reaproveit.ai.
                    </p>

                </div>

            `;
        }

        abrirPainel();
    });

});

// ======================================================
// BOTÃO PARA LIMPAR INGREDIENTES APÓS A GERAÇÃO DA IA
// ======================================================

function criarBotaoLimparSelecao() {

    if (!selectedIngredient || clearSelectedIngredientsButton) return;

    clearSelectedIngredientsButton = document.createElement("button");

    clearSelectedIngredientsButton.type = "button";
    clearSelectedIngredientsButton.id = "clearSelectedIngredientsButton";

    clearSelectedIngredientsButton.textContent =
        "Limpar ingredientes selecionados";

    clearSelectedIngredientsButton.style.cssText = `
        display: none;
        width: 100%;
        margin-top: 14px;
        padding: 14px 20px;
        border: none;
        border-radius: 14px;
        background: #f47720;
        color: #ffffff;
        font-family: "DM Sans", sans-serif;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
    `;

    clearSelectedIngredientsButton.addEventListener("mouseenter", () => {
        clearSelectedIngredientsButton.style.background = "#df6415";
        clearSelectedIngredientsButton.style.transform = "translateY(-2px)";
    });

    clearSelectedIngredientsButton.addEventListener("mouseleave", () => {
        clearSelectedIngredientsButton.style.background = "#f47720";
        clearSelectedIngredientsButton.style.transform = "translateY(0)";
    });

    clearSelectedIngredientsButton.addEventListener(
        "click",
        limparIngredientesSelecionados
    );

    selectedIngredient.insertAdjacentElement(
        "afterend",
        clearSelectedIngredientsButton
    );
}

function mostrarBotaoLimparSelecao(mostrar) {

    if (!clearSelectedIngredientsButton) return;

    clearSelectedIngredientsButton.style.display =
        mostrar ? "block" : "none";
}

function limparIngredientesSelecionados() {

    cards.forEach(card => {

        card.classList.remove("selected");

        card.setAttribute("aria-pressed", "false");

    });

    ingredientesSelecionados = [];

    atualizarControles();
    atualizarTitulo();

    // Mantém as receitas geradas na tela.
    mostrarBotaoLimparSelecao(false);
}

criarBotaoLimparSelecao();

// ======================================================
// ATUALIZAR TÍTULO
// ======================================================

function atualizarTitulo() {

    if (!selectedIngredient) return;

    if (ingredientesSelecionados.length === 0) {

        selectedIngredient.textContent = "Nenhum ingrediente";

        return;
    }

    if (ingredientesSelecionados.length === 1) {

        selectedIngredient.textContent =
            ingredientesSelecionados[0].nome;

        return;
    }

    selectedIngredient.textContent =
        `${ingredientesSelecionados.length} ingredientes`;
}

// ======================================================
// ATUALIZAR CONTROLES
// ======================================================

function atualizarControles() {

    const resumo = document.getElementById("selectionSummary");
    const botaoIA = document.getElementById("generateAIButton");

    const quantidade = ingredientesSelecionados.length;

    if (resumo) {

        if (quantidade === 0) {

            resumo.textContent = "Nenhum ingrediente selecionado.";

        } else {

            resumo.textContent =
                `${quantidade} ingrediente(s): ` +
                ingredientesSelecionados.map(item => item.nome).join(", ");
        }
    }

    if (botaoIA) {
        botaoIA.disabled = quantidade < 2;
    }
}

// ======================================================
// LOADING
// ======================================================

function mostrarLoading(mensagem) {

    if (!recipeList) return;

    recipeList.innerHTML = `

        <div class="loading">

            <div class="loading-spinner"></div>

            <p>${escaparHTML(mensagem)}</p>

        </div>

    `;
}

// ======================================================
// BUSCAR RECEITAS CADASTRADAS
// ======================================================

async function buscarReceitasBanco() {

    if (ingredientesSelecionados.length === 0) {

        mostrarErro("Selecione um ingrediente antes de consultar o banco.");

        return;
    }

    const ingrediente = ingredientesSelecionados[0];

    abrirPainel();

    modoAtual = "banco";

    mostrarBotaoLimparSelecao(false);

    mostrarLoading("Buscando receitas cadastradas...");

    atualizarTitulo();

    const botaoBanco = document.getElementById("searchDatabaseButton");

    if (botaoBanco) {
        botaoBanco.disabled = true;
        botaoBanco.textContent = "Buscando receitas...";
    }

    try {

        const url =
            `${API_URL}/receitas/${encodeURIComponent(ingrediente.id)}`;

        console.log("Buscando receitas no banco:", url);

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();

        console.log("Receitas recebidas do banco:", dados);

        if (!Array.isArray(dados) || dados.length === 0) {

            ultimaRespostaBanco = [];

            mostrarSemReceitas();

            return;
        }

        ultimaRespostaBanco = dados;

        mostrarReceitas(dados);

        rolarParaResultados();

    } catch (erro) {

        console.error("Erro ao buscar receitas:", erro);

        mostrarErro(
            "Não foi possível carregar as receitas cadastradas. Verifique se a API está funcionando."
        );

    } finally {

        if (botaoBanco) {

            botaoBanco.disabled = false;

            botaoBanco.textContent = "Ver receitas cadastradas";
        }
    }
}

// ======================================================
// GERAR RECEITAS COM IA
// ======================================================

async function gerarReceitasIA() {

    if (ingredientesSelecionados.length < 2) {

        mostrarErro("Selecione pelo menos dois ingredientes para utilizar a IA.");

        return;
    }

    const ingredientes = ingredientesSelecionados.map(item => item.nome);

    abrirPainel();

    modoAtual = "ia";

    mostrarBotaoLimparSelecao(false);

    mostrarLoading("Nossa IA está combinando seus ingredientes...");

    atualizarTitulo();

    rolarParaResultados();

    const botaoIA = document.getElementById("generateAIButton");

    if (botaoIA) {
        botaoIA.disabled = true;
        botaoIA.textContent = "Gerando receitas...";
    }

    try {

        const url = `${API_URL}/epicure/combinar`;

        console.log("Consultando IA do Reaproveit.ai");
        console.log("Ingredientes enviados:", ingredientes);

        const resposta = await fetch(url, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                ingredientes
            })

        });

        const dados = await resposta.json();

        console.log("Resposta da IA:", dados);

        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                dados.mensagem ||
                `Erro HTTP: ${resposta.status}`
            );
        }

        const receitas = Array.isArray(dados)
            ? dados
            : dados.receitas || (dados.receita ? [dados.receita] : []);

        if (receitas.length === 0) {

            ultimaRespostaIA = [];

            mostrarSemReceitasIA();

            return;
        }

        ultimaRespostaIA = receitas;

        mostrarReceitasIA(receitas);

    } catch (erro) {

        console.error("Erro ao gerar receitas com IA:", erro);

        mostrarErro(
            erro.message ||
            "Não foi possível gerar as receitas. Tente novamente."
        );

    } finally {

        if (botaoIA) {

            botaoIA.disabled = ingredientesSelecionados.length < 2;

            botaoIA.textContent = " Gerar receitas com IA";
        }
    }
}

// ======================================================
// MOSTRAR RECEITAS DA IA
// ======================================================

function mostrarReceitasIA(receitas) {

    if (!recipeList) return;

    modoAtual = "ia";

    recipeList.innerHTML = "";

    receitas.forEach((receita, index) => {

        const card = document.createElement("article");

        card.className = "recipe-card";

        card.style.animationDelay = `${index * 0.1}s`;

        const nome = receita.nome || "Receita sugerida pela IA";

        const descricao =
            receita.descricao ||
            "Uma sugestão para aproveitar melhor seus ingredientes.";

        const tempo = receita.tempo_preparo || "Não informado";

        const dificuldade = receita.dificuldade || "Não informada";

        card.innerHTML = `

            <span class="ai-recipe-label">
                Receita sugerida pela IA
            </span>

            <div class="recipe-info">

                <h3>
                    ${escaparHTML(nome)}
                </h3>

                <p class="ai-description">
                    ${escaparHTML(descricao)}
                </p>

                <div class="ai-recipe-meta">

                    <span>
                        ${escaparHTML(tempo)}
                    </span>

                    <span>
                        • ${escaparHTML(dificuldade)}
                    </span>

                </div>

                <button
                    class="recipe-button"
                    type="button"
                >
                    Ver receita completa
                </button>

            </div>

        `;

        card
            .querySelector(".recipe-button")
            .addEventListener("click", () => {

                mostrarDetalhesIA(receita);

            });

        recipeList.appendChild(card);
    });

    // O botão aparece somente depois que as receitas forem exibidas.
    mostrarBotaoLimparSelecao(true);
}

// ======================================================
// NORMALIZAR LISTAS DE INGREDIENTES DA IA
// ======================================================

function normalizarLista(lista) {

    if (!lista) return [];

    if (Array.isArray(lista)) {
        return lista;
    }

    if (typeof lista === "string") {

        return lista
            .split(/\r?\n|,/)
            .map(item => item.trim())
            .filter(item => item !== "");
    }

    return [];
}

// ======================================================
// CRIAR HTML DE UMA LISTA DE INGREDIENTES
// ======================================================

function criarListaIngredientes(lista) {

    lista = normalizarLista(lista);

    if (!lista.length) {
        return "<li>Não informado.</li>";
    }

    return lista.map(item => {

        const nome = typeof item === "string"
            ? item
            : item.nome || item.ingrediente || "Ingrediente";

        const quantidade = typeof item === "object"
            ? item.quantidade
            : "";

        const complemento = quantidade
            ? ` — ${escaparHTML(quantidade)}`
            : "";

        return `
            <li>
                <strong>${escaparHTML(nome)}</strong>${complemento}
            </li>
        `;

    }).join("");
}

// ======================================================
// MOSTRAR DETALHES DA RECEITA DA IA
// ======================================================

function mostrarDetalhesIA(receita) {

    if (!recipeList) return;

    const aproveitados = criarListaIngredientes(
        receita.ingredientes_aproveitados
    );

    const adicionais = criarListaIngredientes(
        receita.ingredientes_adicionais
    );

    const naoUtilizados = normalizarLista(
        receita.ingredientes_nao_utilizados
    );

    const naoUtilizadosHTML = naoUtilizados.length
        ? naoUtilizados.map(item => {

            const nome = typeof item === "string"
                ? item
                : item.nome || "Ingrediente";

            const justificativa = typeof item === "object"
                ? item.justificativa || ""
                : "";

            return `
                <li>
                    <strong>${escaparHTML(nome)}</strong>
                    ${justificativa
                        ? ` — ${escaparHTML(justificativa)}`
                        : ""}
                </li>
            `;

        }).join("")
        : "<li>Todos os ingredientes selecionados foram aproveitados.</li>";

    const preparoHTML = formatarModoPreparo(receita.modo_preparo);

    recipeList.innerHTML = `

        <div class="recipe-detail">

            <button
                class="back-button"
                type="button"
                id="backToAIRecipes"
            >
                ← Voltar para receitas
            </button>

            <span class="ai-recipe-label">
                 Receita criada pela IA
            </span>

            <h2>
                ${escaparHTML(receita.nome || "Receita")}
            </h2>

            <p class="ai-description">
                ${escaparHTML(receita.descricao || "")}
            </p>

            <div class="ai-recipe-meta">

                <span>
                    ${escaparHTML(receita.tempo_preparo || "Não informado")}
                </span>

                <span>
                    • ${escaparHTML(receita.dificuldade || "Não informada")}
                </span>

            </div>

            <section class="recipe-section">

                <h3>Ingredientes aproveitados</h3>

                <ul>
                    ${aproveitados}
                </ul>

            </section>

            <section class="recipe-section">

                <h3>Ingredientes adicionais</h3>

                <ul>
                    ${adicionais}
                </ul>

            </section>

            <section class="recipe-section">

                <h3>Ingredientes não utilizados</h3>

                <ul>
                    ${naoUtilizadosHTML}
                </ul>

            </section>

            <section class="recipe-section">

                <h3>Modo de preparo</h3>

                <div class="lista-passos">
                    ${preparoHTML}
                </div>

            </section>

            <section class="recipe-section">

                <h3>Dica de reaproveitamento</h3>

                <p>
                    ${escaparHTML(
                        receita.dica_reaproveitamento ||
                        "Aproveite os ingredientes restantes em outras preparações."
                    )}
                </p>

            </section>

        </div>

    `;

    document
        .getElementById("backToAIRecipes")
        .addEventListener("click", () => {

            mostrarReceitasIA(ultimaRespostaIA);

        });
}

// ======================================================
// FORMATAR MODO DE PREPARO
// ======================================================

function formatarModoPreparo(modoPreparo) {

    if (!modoPreparo) {

        return `
            <p class="preparo-vazio">
                Modo de preparo não informado.
            </p>
        `;
    }

    let passos = [];

    if (Array.isArray(modoPreparo)) {

        passos = modoPreparo
            .map(passo => String(passo).trim())
            .filter(passo => passo !== "");

    } else {

        const texto = String(modoPreparo)
            .replace(/\r/g, "")
            .trim();

        let porLinha = texto
            .split(/\n+/)
            .map(passo => passo.trim())
            .filter(passo => passo !== "");

        if (porLinha.length <= 1) {

            porLinha = texto
                .split(/\s*(?=\d+[\.\)]\s*)/)
                .map(passo => passo.trim())
                .filter(passo => passo !== "");
        }

        passos = porLinha;
    }

    passos = passos.map(passo =>
        passo.replace(/^\s*\d+[\.\)]\s*/, "").trim()
    );

    if (passos.length === 0) {

        return `
            <p class="preparo-vazio">
                Modo de preparo não informado.
            </p>
        `;
    }

    return passos.map((passo, index) => `

        <div class="passo-receita">

            <span class="numero-passo">
                ${index + 1}
            </span>

            <p>
                ${escaparHTML(passo)}
            </p>

        </div>

    `).join("");
}

// ======================================================
// CORRIGIR CAMINHO DAS IMAGENS
// ======================================================

function corrigirImagem(caminho) {

    if (!caminho) {
        return "/imagens/logoicone.png";
    }

    caminho = String(caminho).trim();

    if (
        caminho.startsWith("http://") ||
        caminho.startsWith("https://") ||
        caminho.startsWith("data:image/")
    ) {
        return caminho;
    }

    if (caminho.startsWith("imagens/")) {
        return "/" + caminho;
    }

    if (caminho.startsWith("/imagens/")) {
        return caminho;
    }

    return "/imagens/receitas/" + caminho;
}

// ======================================================
// MOSTRAR RECEITAS CADASTRADAS
// ======================================================

function mostrarReceitas(receitas) {

    if (!recipeList) return;

    modoAtual = "banco";

    recipeList.innerHTML = "";

    receitas.forEach((receita, index) => {

        const imagem = corrigirImagem(receita.imagem);

        const card = document.createElement("article");

        card.className = "recipe-card";

        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `

            <img
                class="recipe-image"
                src="${escaparHTML(imagem)}"
                alt="${escaparHTML(receita.nome || "Receita")}"
                onerror="this.src='/imagens/logoicone.png'"
            >

            <div class="recipe-info">

                <h3>
                    ${escaparHTML(receita.nome || "Receita sem nome")}
                </h3>

                <button
                    class="recipe-button"
                    type="button"
                >
                    Ver receita completa
                </button>

            </div>

        `;

        card.querySelector(".recipe-button").addEventListener("click", () => {

            if (receita.id) {

                verReceita(receita.id);

            } else {

                mostrarDetalhes(receita);

            }
        });

        recipeList.appendChild(card);
    });
}

// ======================================================
// BUSCAR RECEITA COMPLETA NO BANCO
// ======================================================

async function verReceita(id) {

    if (!id) return;

    mostrarLoading("Carregando receita...");

    try {

        const url = `${API_URL}/receita/${encodeURIComponent(id)}`;

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const receita = await resposta.json();

        if (!receita) {
            throw new Error("Receita não encontrada.");
        }

        mostrarDetalhes(receita);

    } catch (erro) {

        console.error("Erro ao buscar receita:", erro);

        mostrarErro("Não foi possível carregar o modo de preparo.");
    }
}

// ======================================================
// MOSTRAR DETALHES DA RECEITA CADASTRADA
// ======================================================

function mostrarDetalhes(receita) {

    if (!recipeList) return;

    const imagem = corrigirImagem(receita.imagem);

    let ingredientes = [];

    if (Array.isArray(receita.ingredientes)) {

        ingredientes = receita.ingredientes;

    } else if (typeof receita.ingredientes === "string") {

        ingredientes = receita.ingredientes
            .split(/\r?\n|,/)
            .map(item => item.trim())
            .filter(item => item !== "");

    } else if (Array.isArray(receita.ingrediente)) {

        ingredientes = receita.ingrediente;

    } else if (typeof receita.ingrediente === "string") {

        ingredientes = receita.ingrediente
            .split(/\r?\n|,/)
            .map(item => item.trim())
            .filter(item => item !== "");
    }

    const modoPreparo =
        receita.modoPreparo || receita.modo_preparo;

    const ingredientesHTML = ingredientes.length
        ? ingredientes.map(item => `

            <li>
                ${escaparHTML(
                    typeof item === "string"
                        ? item
                        : item.nome || ""
                )}
            </li>

        `).join("")
        : "<li>Ingredientes não informados.</li>";

    const preparoHTML = formatarModoPreparo(modoPreparo);

    recipeList.innerHTML = `

        <div class="recipe-detail">

            <button
                class="back-button"
                type="button"
                id="backToDatabaseRecipes"
            >
                ← Voltar para receitas
            </button>

            <img
                class="recipe-detail-image"
                src="${escaparHTML(imagem)}"
                alt="${escaparHTML(receita.nome || "Receita")}"
                onerror="this.src='/imagens/logoicone.png'"
            >

            <h2>
                ${escaparHTML(receita.nome || "Receita")}
            </h2>

            <section class="recipe-section">

                <h3>Ingredientes</h3>

                <ul>
                    ${ingredientesHTML}
                </ul>

            </section>

            <section class="recipe-section">

                <h3>Modo de preparo</h3>

                <div class="lista-passos">
                    ${preparoHTML}
                </div>

            </section>

        </div>

    `;

    document
        .getElementById("backToDatabaseRecipes")
        .addEventListener("click", () => {

            mostrarReceitas(ultimaRespostaBanco);

        });
}

// ======================================================
// MENSAGENS
// ======================================================

function mostrarSemReceitas() {

    if (!recipeList) return;

    recipeList.innerHTML = `

        <div class="no-recipes">

            <h3>Nenhuma receita encontrada</h3>

            <p>
                Ainda não temos receitas cadastradas
                para este ingrediente.
            </p>

        </div>

    `;
}

function mostrarSemReceitasIA() {

    if (!recipeList) return;

    recipeList.innerHTML = `

        <div class="no-recipes">

            <h3>Não encontramos uma combinação adequada</h3>

            <p>
                Tente selecionar outros ingredientes.
                A IA não precisa utilizar alimentos que não combinam entre si.
            </p>

        </div>

    `;
}

function mostrarErro(mensagem) {

    if (!recipeList) return;

    recipeList.innerHTML = `

        <div class="no-recipes">

            <h3>Não foi possível concluir a busca</h3>

            <p>
                ${escaparHTML(mensagem)}
            </p>

        </div>

    `;
}

// ======================================================
// FECHAR PAINEL E LIMPAR SELEÇÃO
// ======================================================

if (closeRecipes) {

    closeRecipes.addEventListener("click", () => {

        if (recipesContent) {
            recipesContent.classList.remove("active");
            recipesContent.style.display = "none";
        }

        if (placeholder) {
            placeholder.style.display = "flex";
        }

        cards.forEach(card => {

            card.classList.remove("selected");
            card.setAttribute("aria-pressed", "false");

        });

        ingredientesSelecionados = [];

        ultimaRespostaIA = [];
        ultimaRespostaBanco = [];

        modoAtual = "";

        mostrarBotaoLimparSelecao(false);

        atualizarControles();

        if (selectedIngredient) {
            selectedIngredient.textContent = "Ingrediente";
        }

        if (recipeList) {
            recipeList.innerHTML = "";
        }

    });
}

// ======================================================
// ESTADO INICIAL
// ======================================================

cards.forEach(card => {

    card.setAttribute(
        "aria-pressed",
        card.classList.contains("selected") ? "true" : "false"
    );

});

atualizarControles();