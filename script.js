/* =========================================================
   ReciclaTech — script.js (JavaScript geral)
   Usado em: todas as páginas.

   O que faz:
   - botão "Alto contraste" (e lembra a escolha no navegador);
   - menu sanduíche do celular;
   - painel "Ajustes de leitura" (fecha com Esc ou clique fora);
   - validação do formulário de contato (contato.html).

   Os outros arquivos: tamanho.js (A-/A/A+), leitura-voz.js
   (leitura em voz alta), galeria.js (galeria.html) e doacao.js
   (formulário de doação, que este arquivo ignora).

   Tudo fica dentro de uma função que se executa sozinha,
   (function () { ... })(), para nenhuma variável deste arquivo
   virar global e se misturar com as dos outros arquivos.
   "use strict" faz o navegador acusar erros comuns em vez de
   ignorá-los.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Configuração ---------- */

  // Chave do localStorage onde fica a escolha do alto contraste ("1" ou "0")
  const CHAVE_CONTRASTE = "rt-hc";
  // Rascunho antigo do formulário de contato, que não é mais usado
  const CHAVE_RASCUNHO_ANTIGO = "rt-contato";

  /* ---------- Referências aos elementos ---------- */

  const raiz = document.documentElement; // o <html>, que recebe a classe .hc
  const menu = document.getElementById("menu");
  const botaoMenu = document.querySelector("[aria-controls=menu]");

  // true = alto contraste ligado
  let contraste = false;

  /* ---------- Funções: alto contraste ---------- */

  // Recebe: nada. Faz: lê a escolha salva no navegador.
  // Devolve: true se o alto contraste estava ligado.
  // (try/catch: o localStorage pode estar bloqueado, por exemplo no
  // modo privado de alguns navegadores; aí o site segue sem lembrar.)
  function lerContrasteSalvo() {
    try {
      return localStorage.getItem(CHAVE_CONTRASTE) === "1";
    } catch (e) {
      return false;
    }
  }

  // Recebe: nada (usa a variável "contraste"). Faz: põe ou tira a classe
  // .hc do <html>, guarda a escolha e atualiza o aria-pressed do botão,
  // que diz ao leitor de tela se o botão está "pressionado". Devolve: nada.
  function aplicarContraste() {
    raiz.classList.toggle("hc", contraste);
    try {
      localStorage.setItem(CHAVE_CONTRASTE, contraste ? "1" : "0");
    } catch (e) {}
    const botao = document.querySelector("[data-a11y=hc]");
    if (botao) botao.setAttribute("aria-pressed", String(contraste));
  }

  /* ---------- Funções: menu e painel de ajustes ---------- */

  // Recebe: true (abrir) ou false (fechar). Faz: mostra ou esconde o menu
  // e atualiza o aria-expanded do botão sanduíche. Devolve: nada.
  function definirMenu(aberto) {
    if (!menu || !botaoMenu) return;
    botaoMenu.setAttribute("aria-expanded", String(aberto));
    menu.classList.toggle("hidden", !aberto);
    menu.classList.toggle("block", aberto);
  }

  // Recebe: nada. Devolve: true se o botão sanduíche está na tela
  // (ele só aparece em telas menores que 64rem, ou 1024px).
  function sanduicheVisivel() {
    return !!botaoMenu && getComputedStyle(botaoMenu).display !== "none";
  }

  // Recebe: nada. Faz: fecha o painel "Ajustes de leitura" (um <details>).
  // Devolve: nada.
  function fecharAjustes() {
    const ajustes = document.querySelector(".ajustes");
    if (ajustes) ajustes.removeAttribute("open");
  }

  /* ---------- Funções: formulário de contato ---------- */

  // Recebe: um campo do formulário. Devolve: true se ele está certo.
  // Um campo é válido se, quando obrigatório, foi preenchido e se respeita
  // o formato pedido no HTML (pattern, type="email", min/max etc.).
  function campoValido(campo) {
    if (campo.type === "checkbox") return !campo.required || campo.checked;
    if (campo.required && campo.type !== "radio" && campo.value.trim() === "") {
      return false;
    }
    return campo.checkValidity();
  }

  // Recebe: um campo. Devolve: o nome dele para a mensagem de erro,
  // tirado da legenda do grupo (radios) ou do rótulo, sem o asterisco.
  function nomeDoCampo(campo) {
    const grupo = campo.closest("fieldset");
    const origem =
      campo.type === "radio"
        ? grupo && grupo.querySelector("legend")
        : campo.labels && campo.labels[0];
    const texto = origem ? origem.textContent : campo.name;
    return texto.replace(/[*.…]/g, "").replace(/\s+/g, " ").trim();
  }

  // Recebe: o campo de telefone. Faz: troca 11912345678 por
  // (11) 91234-5678 (só com 10 ou 11 dígitos). Devolve: nada.
  // (O doacao.js tem a mesma conta para o formulário de doação: cada
  // arquivo funciona sozinho, sem depender do outro.)
  function formatarTelefone(campo) {
    const n = campo.value.replace(/\D/g, "");
    if (n.length !== 10 && n.length !== 11) return;
    campo.value = "(" + n.slice(0, 2) + ") " + n.slice(2, -4) + "-" + n.slice(-4);
  }

  // Recebe: um formulário. Devolve: a lista dos campos com erro (um por
  // grupo de radios). Faz também: marca aria-invalid="true" nos campos
  // errados e tira a marca dos certos (sem erro, o atributo não aparece).
  function camposInvalidos(form) {
    const invalidos = [];
    const gruposVistos = {};

    form.querySelectorAll("input, select, textarea").forEach(function (campo) {
      if (!campo.name || campo.disabled) return;

      const valido = campoValido(campo);
      if (valido) campo.removeAttribute("aria-invalid");
      else campo.setAttribute("aria-invalid", "true");
      if (valido) return;

      // um grupo de radios conta como um campo só
      if (campo.type === "radio") {
        if (gruposVistos[campo.name]) return;
        gruposVistos[campo.name] = true;
      }
      invalidos.push(campo);
    });

    return invalidos;
  }

  // Recebe: um formulário. Devolve: o parágrafo de status dele
  // (cria o parágrafo, com role="status", na primeira vez). O role="status"
  // faz o leitor de tela anunciar a mensagem sem tirar o foco do lugar.
  function statusDoFormulario(form) {
    let status = form.querySelector(".form-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "form-status";
      form.appendChild(status);
    }
    status.setAttribute("role", "status");
    return status;
  }

  // Recebe: um formulário. Faz: liga a validação, a formatação do
  // telefone e a mensagem de envio (demonstração). Devolve: nada.
  function prepararFormulario(form) {
    // Desliga os balões de erro do navegador: as mensagens são do site
    form.setAttribute("novalidate", "");

    form.querySelectorAll('input[type="tel"]').forEach(function (campo) {
      campo.addEventListener("blur", function () {
        formatarTelefone(campo);
      });
    });

    // Depois de um erro, o destaque some assim que o campo fica certo
    form.addEventListener("input", function (e) {
      const campo = e.target;
      if (campo.getAttribute("aria-invalid") !== "true" || !campoValido(campo)) return;
      const grupo =
        campo.type === "radio"
          ? form.querySelectorAll('[name="' + campo.name + '"]')
          : [campo];
      grupo.forEach(function (c) {
        c.removeAttribute("aria-invalid");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const invalidos = camposInvalidos(form);
      const status = statusDoFormulario(form);

      if (invalidos.length) {
        status.textContent =
          "Corrija " +
          invalidos.length +
          " campo(s) obrigatório(s) ou com formato inválido: " +
          invalidos.map(nomeDoCampo).join(", ") +
          ".";
        invalidos[0].focus();
      } else {
        status.textContent = "Mensagem enviada com sucesso! (demonstração)";
        form.reset();
      }
    });
  }

  /* ---------- Eventos ---------- */

  // Um só "ouvinte" de clique para a página toda: vê onde foi o clique
  document.addEventListener("click", function (e) {
    const alvo = e.target;

    if (alvo.closest("[data-a11y=hc]")) {
      contraste = !contraste;
      aplicarContraste();
    }

    const sanduiche = alvo.closest("[aria-controls=menu]");
    if (sanduiche) {
      definirMenu(sanduiche.getAttribute("aria-expanded") !== "true");
    }

    // Clique fora do painel de ajustes fecha o painel (menos no botão sanduíche,
    // para os controles da leitura continuarem à mão ao reabrir o menu)
    if (!alvo.closest(".ajustes") && !sanduiche) fecharAjustes();

    // No celular, ao começar a leitura o menu se fecha para mostrar o texto lido
    if (alvo.closest("#btn-ouvir") && sanduicheVisivel()) definirMenu(false);
  });

  // Abrir o painel (ou o menu) não pode apagar o texto que a pessoa selecionou,
  // porque a leitura em voz alta pode começar por essa seleção
  document.addEventListener("mousedown", function (e) {
    if (
      e.target.closest(".ajustes-resumo") ||
      e.target.closest("[aria-controls=menu]")
    ) {
      e.preventDefault();
    }
  });

  // Esc fecha o painel de ajustes e devolve o foco ao título dele
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    const ajustes = document.querySelector(".ajustes[open]");
    if (!ajustes) return;
    fecharAjustes();
    const resumo = ajustes.querySelector("summary");
    if (resumo) resumo.focus();
  });

  // Formulários: o de doação (data-form="doacao") tem lógica própria em doacao.js
  document.querySelectorAll("form").forEach(function (form) {
    if (form.dataset.form === "doacao") return;
    prepararFormulario(form);
  });

  /* ---------- Início ---------- */

  contraste = lerContrasteSalvo();
  aplicarContraste();

  // O formulário de contato não guarda mais rascunho no navegador (só o de
  // doação guarda). Apaga o rascunho antigo, que tinha nome, e-mail e telefone.
  try {
    localStorage.removeItem(CHAVE_RASCUNHO_ANTIGO);
  } catch (e) {}
})();
