/* =========================================================
   ReciclaTech — vlibras.js (tradução para Libras)
   Usado em: todas as páginas, logo depois do script oficial do
   VLibras (https://vlibras.gov.br/app/vlibras-plugin.js).

   O que faz:
   - monta o botão do VLibras, ferramenta gratuita do Governo Federal
     que traduz o texto da página para a Língua Brasileira de Sinais
     (Libras) com um intérprete virtual em 3D;
   - liga o widget.

   Por que a marcação é criada aqui, e não direto no HTML?
   O VLibras precisa de atributos próprios (vw, vw-access-button e
   vw-plugin-wrapper) que não existem no HTML5. Escritos no HTML, eles
   dariam erro no W3C Validator; criados pelo JavaScript, a página
   continua válida e o widget funciona igual.

   Se o script do VLibras não carregar (sem internet ou serviço fora
   do ar), nada é criado e o resto do site funciona normalmente.

   Tudo fica dentro de uma função que se executa sozinha, com
   "use strict", como nos outros arquivos .js do site.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Configuração ---------- */

  // Endereço do aplicativo do VLibras (o mesmo da documentação oficial)
  const ENDERECO_VLIBRAS = "https://vlibras.gov.br/app";

  // O script oficial não carregou: não há o que montar
  if (!window.VLibras || typeof window.VLibras.Widget !== "function") return;

  /* ---------- Funções ---------- */

  // Recebe: o nome da tag, os atributos ({ nome: valor }) e os filhos.
  // Devolve: o elemento criado, já com os atributos e os filhos.
  function criar(tag, atributos, filhos) {
    const elemento = document.createElement(tag);
    Object.keys(atributos).forEach((nome) => {
      elemento.setAttribute(nome, atributos[nome]);
    });
    (filhos || []).forEach((filho) => elemento.appendChild(filho));
    return elemento;
  }

  /* ---------- Início ---------- */

  // A mesma estrutura da documentação oficial do VLibras:
  // <div vw class="enabled">
  //   <div vw-access-button class="active"></div>   ← botão de abrir
  //   <div vw-plugin-wrapper>                       ← janela do intérprete
  //     <div class="vw-plugin-top-wrapper"></div>
  //   </div>
  // </div>
  const widget = criar("div", { vw: "", class: "enabled" }, [
    criar("div", { "vw-access-button": "", class: "active" }),
    criar("div", { "vw-plugin-wrapper": "" }, [criar("div", { class: "vw-plugin-top-wrapper" })]),
  ]);

  // Fica no fim do <body>, fora do <main>: a leitura em voz alta não lê o widget
  document.body.appendChild(widget);

  // O VLibras termina de se montar no evento "load" da página. Este arquivo
  // roda antes disso (os scripts estão no fim do <body>), então dá tempo.
  new window.VLibras.Widget(ENDERECO_VLIBRAS);
})();
