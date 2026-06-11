# /*

# CONFIGURAÇÕES

ALTERE APENAS ESTES CAMPOS
*/

const GITHUB_OWNER = "deffmain";
const GITHUB_REPO = "Solution-prototyping";

/*
Se o repositório for privado:

1. Crie um Personal Access Token no GitHub
2. Troque abaixo

IMPORTANTE:
Não publique o token em repositório público.

Depois podemos migrar isso para GitHub Actions.
*/

const GITHUB_TOKEN = "SEU_TOKEN_AQUI";

# /*

# BUSCA DAS ISSUES

*/

async function carregarDashboard() {

```
try {

    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&per_page=100`,
        {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json"
            }
        }
    );

    const issues = await response.json();

    processarDados(issues);

} catch (erro) {

    console.error("Erro ao carregar dashboard", erro);

}
```

}

# /*

# PROCESSAMENTO

*/

function processarDados(issues) {

```
/*
Remove Pull Requests
*/

issues = issues.filter(issue => !issue.pull_request);

/*
Cards superiores
*/

const resolvidos = issues.filter(
    issue => issue.state === "Closed"
).length;

/*
IMPORTANTE

Aqui você deverá adaptar conforme
o campo STATUS que criou no Project.

Como ainda não sei exatamente como
seu status está armazenado, deixei
exemplos abaixo.
*/

const abertas = issues.filter(
    issue => issue.state === "open"
).length;

/*
EXEMPLO

Se você usa labels:

label: em-andamento

então altere:
*/

const emAndamento = issues.filter(issue =>
    issue.labels.some(label =>
        label.name.toLowerCase() === "em-andamento"
    )
).length;

const aguardandoCliente = issues.filter(issue =>
    issue.labels.some(label =>
        label.name.toLowerCase() === "aguardando-cliente"
    )
).length;

document.getElementById("totalResolvidos").textContent = resolvidos;
document.getElementById("totalAbertas").textContent = abertas;
document.getElementById("totalAndamento").textContent = emAndamento;
document.getElementById("totalAguardando").textContent = aguardandoCliente;

gerarGrafico(issues);
```

}

# /*

# GRÁFICO POR DIA DA SEMANA

*/

function gerarGrafico(issues) {

```
const diasSemana = {
    "Dom": 0,
    "Seg": 0,
    "Ter": 0,
    "Qua": 0,
    "Qui": 0,
    "Sex": 0,
    "Sáb": 0
};

issues.forEach(issue => {

    const data = new Date(issue.created_at);

    const dia = data.getDay();

    const nomes = [
        "Dom",
        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sáb"
    ];

    diasSemana[nomes[dia]]++;

});

const ctx = document.getElementById("issuesPorDia");

new Chart(ctx, {

    type: "line",

    data: {

        labels: Object.keys(diasSemana),

        datasets: [{
            label: "Issues por dia da semana",
            data: Object.values(diasSemana),
            tension: 0.3
        }]

    },

    options: {

        responsive: true,

        plugins: {
            legend: {
                display: true
            }
        }

    }

});
```

}

carregarDashboard();
