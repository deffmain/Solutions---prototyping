const repo = "deffmain/Solutions-portotyping";

fetch(
  `https://api.github.com/repos/${repo}/issues?state=all`
)
.then(response => response.json())
.then(data => {

  const abertas = data.filter(
    issue => issue.state === "open"
  ).length;

  document.getElementById("abertas").innerText =
    `Chamados abertos: ${abertas}`;
});
