/* =========================================================
   ReciclaTech — galeria.js (botões "Ampliar imagem")
   Usado em: galeria.html.

   Abre a imagem maior numa janela (<dialog>) com a legenda.
   Esc, o botão "Fechar" ou um clique fora da janela fecham;
   o foco volta para a imagem que foi aberta, para quem usa
   teclado não se perder na página.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Referências aos elementos ---------- */

  const dialogo = document.getElementById("galeria-dialogo");
  const botoes = document.querySelectorAll("[data-galeria]");

  // Página sem galeria ou navegador sem <dialog>: não faz nada
  if (!dialogo || !botoes.length || typeof dialogo.showModal !== "function") return;

  const areaImagem = dialogo.querySelector(".galeria-dialogo-imagem");
  const legenda = document.getElementById("galeria-dialogo-legenda");
  const botaoFechar = dialogo.querySelector("[data-fechar]");

  // Botão da imagem aberta agora (para devolver o foco a ele)
  let botaoAberto = null;

  /* ---------- Funções ---------- */

  // Recebe: o botão "Ampliar imagem" clicado. Faz: copia para a janela a
  // imagem (o primeiro filho do botão) e a legenda da <figure>, e abre a
  // janela. Devolve: nada.
  function abrir(botao) {
    botaoAberto = botao;
    const figura = botao.closest("figure");
    const legendaOriginal = figura && figura.querySelector("figcaption");

    // cloneNode(true) copia o elemento com tudo o que tem dentro
    areaImagem.replaceChildren(botao.firstElementChild.cloneNode(true));
    const copiaLegenda = legendaOriginal
      ? [...legendaOriginal.childNodes].map((no) => no.cloneNode(true))
      : [];
    legenda.replaceChildren(...copiaLegenda);

    // showModal() abre como janela "modal": o resto da página fica
    // inacessível até fechar, e o foco vai para o botão "Fechar"
    dialogo.showModal();
  }

  /* ---------- Eventos ---------- */

  botoes.forEach((botao) => botao.addEventListener("click", () => abrir(botao)));
  botaoFechar.addEventListener("click", () => dialogo.close());

  // Clique no fundo escurecido (fora do conteúdo) fecha a janela:
  // nesse caso o alvo do clique é o próprio <dialog>
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo) dialogo.close();
  });

  // Ao fechar (por qualquer caminho, inclusive Esc), o foco volta para
  // a imagem que estava aberta
  dialogo.addEventListener("close", () => {
    if (botaoAberto) botaoAberto.focus();
    botaoAberto = null;
  });
})();
