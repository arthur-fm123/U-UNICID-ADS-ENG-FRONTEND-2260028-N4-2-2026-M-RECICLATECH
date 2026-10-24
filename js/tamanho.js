/* =========================================================
   ReciclaTech — scripts
   Controle de tamanho da fonte (A-, A, A+) — ajuste gradual
   ========================================================= */

// Configurações (valores em % do tamanho padrão do navegador: 100% = 16px)
const TAMANHO_PADRAO = 100;
const TAMANHO_MINIMO = 80;
const TAMANHO_MAXIMO = 130;
const PASSO = 5;

// Seleciona os três botões do controle de fonte
const botoes = document.querySelectorAll(".controle-fonte button");
const botaoDiminuir = document.querySelector('[data-acao="diminuir"]');
const botaoAumentar = document.querySelector('[data-acao="aumentar"]');

// Guarda o tamanho em uso
let tamanhoAtual = TAMANHO_PADRAO;

// Aplica um tamanho (respeitando mínimo e máximo), atualiza os botões e guarda a escolha
function aplicarTamanho(tamanho) {
    tamanhoAtual = Math.min(TAMANHO_MAXIMO, Math.max(TAMANHO_MINIMO, tamanho));
    document.documentElement.style.fontSize = tamanhoAtual + "%";
    botaoDiminuir.disabled = tamanhoAtual <= TAMANHO_MINIMO;
    botaoAumentar.disabled = tamanhoAtual >= TAMANHO_MAXIMO;
    try { localStorage.setItem("tamanhoFonte", tamanhoAtual); } catch (e) {}
}

// Ao clicar, aumenta, diminui ou volta ao padrão, conforme o botão
botoes.forEach(function (botao) {
    botao.addEventListener("click", function () {
        const acao = botao.dataset.acao;
        if (acao === "aumentar") {
            aplicarTamanho(tamanhoAtual + PASSO);
        } else if (acao === "diminuir") {
            aplicarTamanho(tamanhoAtual - PASSO);
        } else {
            aplicarTamanho(TAMANHO_PADRAO);
        }
    });
});

// Ao abrir o site, usa o tamanho salvo (ou o padrão se não houver)
let salvo = null;
try { salvo = Number(localStorage.getItem("tamanhoFonte")); } catch (e) {}
aplicarTamanho(salvo || TAMANHO_PADRAO);


