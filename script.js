/*
CONFIGURAÇÕES
*/

const GITHUB_OWNER = "deffmain";
const GITHUB_REPO = "Solutions---prototyping";

/*
O dashboard lê o arquivo data.json, gerado pelo GitHub Action
(.github/workflows/dashboard-data.yml) a partir dos quadros de Projects.

Se o data.json ainda não existir (Action não configurado), ele usa
as issues públicas do repositório como alternativa. Nunca coloque
token neste arquivo: ele fica visível para qualquer visitante.
*/

async function carregarDashboard() {
    try {
        const dados = await carregarDados();
        renderizarAviso(dados);
        renderizarCards(dados.itens);
        renderizarQuadros(dados.quadros);
        gerarGrafico(dados.itens);
        renderizarRodape(dados);
    } catch (erro) {
        console.error("Erro ao carregar dashboard", erro);
        const aviso = document.getElementById("aviso");
        aviso.hidden = false;
        aviso.textContent = "Erro ao carregar os dados do dashboard: " + erro.message;
    }
}

/*
CARREGAMENTO DOS DADOS
*/

async function carregarDados() {
    // 1ª opção: data.json gerado pelo GitHub Action (dados dos Projects)
    try {
        const resposta = await fetch("data.json", { cache: "no-store" });
        if (resposta.ok) {
            const dados = await resposta.json();
            dados.fonte = "projects";
            dados.itens = dados.quadros.flatMap(q =>
                q.itens.map(item => ({ ...item, quadro: q.titulo }))
            );
            return dados;
        }
    } catch (erro) {
        console.warn("data.json indisponível, usando issues públicas", erro);
    }

    // 2ª opção: issues públicas do repositório (não exige token)
    const resposta = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&per_page=100`,
        { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!resposta.ok) {
        throw new Error(`GitHub API respondeu ${resposta.status}`);
    }

    const issues = (await resposta.json()).filter(issue => !issue.pull_request);

    const itens = issues.map(issue => ({
        titulo: issue.title,
        numero: issue.number,
        url: issue.html_url,
        status: issue.state === "closed" ? "Fechada" : "Aberta",
        estado: issue.state,
        criadaEm: issue.created_at,
        quadro: "Issues do repositório"
    }));

    return {
        fonte: "issues",
        atualizadoEm: new Date().toISOString(),
        quadros: [{ titulo: "Issues do repositório", itens }],
        itens
    };
}

/*
AVISO (modo alternativo)
*/

function renderizarAviso(dados) {
    const aviso = document.getElementById("aviso");
    if (dados.fonte === "issues") {
        aviso.hidden = false;
        aviso.textContent =
            "Exibindo issues públicas do repositório. Para mostrar os quadros do " +
            "Projects, configure o secret PROJECTS_TOKEN e execute o workflow " +
            "\"Atualizar dados do dashboard\".";
    } else {
        aviso.hidden = true;
    }
}

/*
CARDS — um card por status encontrado, mais o total
*/

function renderizarCards(itens) {
    const contagem = {};
    itens.forEach(item => {
        const status = item.status || "Sem status";
        contagem[status] = (contagem[status] || 0) + 1;
    });

    const cards = document.getElementById("cards");
    cards.innerHTML = "";

    cards.appendChild(criarCard("Total de itens", itens.length));
    Object.entries(contagem).forEach(([status, total]) => {
        cards.appendChild(criarCard(status, total));
    });
}

function criarCard(titulo, valor) {
    const card = document.createElement("div");
    card.className = "card";

    const h3 = document.createElement("h3");
    h3.textContent = titulo;

    const span = document.createElement("span");
    span.textContent = valor;

    card.append(h3, span);
    return card;
}

/*
QUADROS — uma seção por quadro do Projects, com tabela de itens
*/

function renderizarQuadros(quadros) {
    const container = document.getElementById("quadros");
    container.innerHTML = "";

    quadros.forEach(quadro => {
        const secao = document.createElement("section");
        secao.className = "quadro";

        const h2 = document.createElement("h2");
        h2.textContent = quadro.titulo;
        secao.appendChild(h2);

        const tabela = document.createElement("table");
        tabela.innerHTML =
            "<thead><tr><th>Status</th><th>Item</th><th>Criado em</th></tr></thead>";

        const tbody = document.createElement("tbody");
        quadro.itens.forEach(item => {
            const tr = document.createElement("tr");

            const tdStatus = document.createElement("td");
            tdStatus.textContent = item.status || "Sem status";

            const tdTitulo = document.createElement("td");
            if (item.url) {
                const link = document.createElement("a");
                link.href = item.url;
                link.target = "_blank";
                link.textContent = item.numero ? `#${item.numero} ${item.titulo}` : item.titulo;
                tdTitulo.appendChild(link);
            } else {
                tdTitulo.textContent = item.titulo;
            }

            const tdData = document.createElement("td");
            tdData.textContent = item.criadaEm
                ? new Date(item.criadaEm).toLocaleDateString("pt-BR")
                : "—";

            tr.append(tdStatus, tdTitulo, tdData);
            tbody.appendChild(tr);
        });

        tabela.appendChild(tbody);
        secao.appendChild(tabela);
        container.appendChild(secao);
    });
}

/*
GRÁFICO — itens criados por dia da semana
*/

function gerarGrafico(itens) {
    const nomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const porDia = [0, 0, 0, 0, 0, 0, 0];

    itens.forEach(item => {
        if (!item.criadaEm) return;
        porDia[new Date(item.criadaEm).getDay()]++;
    });

    new Chart(document.getElementById("issuesPorDia"), {
        type: "line",
        data: {
            labels: nomes,
            datasets: [{
                label: "Itens criados por dia da semana",
                data: porDia,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    });
}

/*
RODAPÉ
*/

function renderizarRodape(dados) {
    if (!dados.atualizadoEm) return;
    document.getElementById("atualizadoEm").textContent =
        "Atualizado em " + new Date(dados.atualizadoEm).toLocaleString("pt-BR");
}

carregarDashboard();
