/* =========================================================
   ReciclaTech — tamanho.js (tamanho da fonte: A-, A, A+)
   Usado em: todas as páginas (botões no painel "Ajustes de leitura").

   Como funciona: o style.css define
     html { font-size: calc(100% * var(--fs, 1)); }
   Este arquivo só muda a variável --fs (0,8 a 1,3). Como quase
   tudo no CSS usa rem, o site inteiro cresce ou diminui junto.
   A escolha fica guardada no navegador (localStorage, chave "rt-fs").
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Configuração ---------- */

  // Tamanhos em % do padrão do navegador (100% = 16px)
  const TAMANHO_PADRAO = 100;
  const TAMANHO_MINIMO = 80;
  const TAMANHO_MAXIMO = 130;
  const PASSO = 5; // quanto cada clique em A- ou A+ muda
  const CHAVE = "rt-fs"; // mesma chave que o site já usava

  /* ---------- Referências aos elementos ---------- */

  const botoes = document.querySelectorAll(".controle-fonte button");
  const botaoDiminuir = document.querySelector('.controle-fonte [data-acao="diminuir"]');
  const botaoAumentar = document.querySelector('.controle-fonte [data-acao="aumentar"]');

  // Página sem os botões: não há nada a fazer
  if (!botoes.length || !botaoDiminuir || !botaoAumentar) return;

  let tamanhoAtual = TAMANHO_PADRAO;

  /* ---------- Funções ---------- */

  // Recebe: o tamanho desejado (em %). Faz: respeita o mínimo e o máximo,
  // aplica no <html>, desabilita A- ou A+ quando chega ao limite e guarda
  // a escolha no navegador. Devolve: nada.
  function aplicarTamanho(tamanho) {
    tamanhoAtual = Math.min(TAMANHO_MAXIMO, Math.max(TAMANHO_MINIMO, tamanho));
    document.documentElement.style.setProperty("--fs", tamanhoAtual / 100);
    botaoDiminuir.disabled = tamanhoAtual <= TAMANHO_MINIMO;
    botaoAumentar.disabled = tamanhoAtual >= TAMANHO_MAXIMO;
    try {
      localStorage.setItem(CHAVE, tamanhoAtual / 100);
    } catch (e) {}
  }

  // Recebe: nada. Devolve: o tamanho salvo (em %) ou 0 se não houver
  // (o try/catch protege caso o localStorage esteja bloqueado).
  function lerTamanhoSalvo() {
    try {
      return Math.round(Number(localStorage.getItem(CHAVE)) * 100);
    } catch (e) {
      return 0;
    }
  }

  /* ---------- Eventos ---------- */

  // Cada botão diz o que faz no atributo data-acao:
  // "aumentar", "diminuir" ou "resetar" (volta ao padrão)
  botoes.forEach(function (botao) {
    botao.addEventListener("click", function () {
      const acao = botao.dataset.acao;
      if (acao === "aumentar") aplicarTamanho(tamanhoAtual + PASSO);
      else if (acao === "diminuir") aplicarTamanho(tamanhoAtual - PASSO);
      else aplicarTamanho(TAMANHO_PADRAO);
    });
  });

  /* ---------- Início ---------- */

  // Ao abrir a página, usa o tamanho salvo (ou o padrão)
  aplicarTamanho(lerTamanhoSalvo() || TAMANHO_PADRAO);
})();
