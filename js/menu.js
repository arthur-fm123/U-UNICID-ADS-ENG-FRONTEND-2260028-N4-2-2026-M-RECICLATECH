/* =========================================================
   Menu de acessibilidade (botão com o símbolo universal)
   Abre e fecha o painel que guarda os controles
   ========================================================= */

   const menuA11y = document.getElementById("a11y");
   const botaoMenuA11y = document.getElementById("a11y-toggle");
   
   // Abre ou fecha o painel e mantém os atributos de acessibilidade em dia
   function alternarMenuA11y(aberto) {
       menuA11y.classList.toggle("is-open", aberto);
       botaoMenuA11y.setAttribute("aria-expanded", String(aberto));
       botaoMenuA11y.setAttribute(
           "aria-label",
           aberto ? "Fechar menu de acessibilidade" : "Abrir menu de acessibilidade"
       );
   }
   
   botaoMenuA11y.addEventListener("click", function () {
       alternarMenuA11y(!menuA11y.classList.contains("is-open"));
   });
   
   // Esc fecha o painel e devolve o foco ao botão
   document.addEventListener("keydown", function (e) {
       if (e.key === "Escape" && menuA11y.classList.contains("is-open")) {
           alternarMenuA11y(false);
           botaoMenuA11y.focus();
       }
   });
   
   // Clique fora do menu fecha o painel
   document.addEventListener("click", function (e) {
       if (!menuA11y.contains(e.target)) alternarMenuA11y(false);
   });
   