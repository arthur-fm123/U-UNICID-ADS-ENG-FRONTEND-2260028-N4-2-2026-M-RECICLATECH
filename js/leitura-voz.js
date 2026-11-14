/* =========================================================
   ReciclaTech — leitura-voz.js (leitura em voz alta)
   Usado em: todas as páginas (botões no painel "Ajustes de leitura").

   Usa a Web Speech API, que já vem nos navegadores (speechSynthesis).
   Lê os textos do <main>, trecho por trecho, destacando e rolando até
   o trecho lido. Começa:
     (a) do trecho que a pessoa selecionou com o mouse; ou
     (b) do primeiro trecho visível na tela; ou
     (c) do início do <main>.
   Se a pessoa rolar a página na mão durante a leitura, o script para
   de rolar sozinho e mostra o botão "Ir para o trecho lido".
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Configuração ---------- */

  const LANG = "pt-BR";
  // Elementos de texto que viram "trechos" de leitura
  // (label entra para os nomes dos campos dos formulários serem lidos)
  const SELECTORES =
    "h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, dt, dd, caption, tr, summary, legend, label";
  // Teclas que rolam a página: usá-las conta como "rolar na mão"
  const TECLAS_ROLAGEM = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
  // Tempo da rolagem suave feita pelo script (ms)
  const TEMPO_ROLAGEM = 700;
  // Quantos caracteres do trecho aparecem na mensagem "Lendo: ..."
  const TAMANHO_RESUMO = 90;

  /* ---------- Referências aos elementos ---------- */

  const $ = (id) => document.getElementById(id);

  const painel = $("painel-leitura");
  // Página sem o painel de leitura: não há nada a fazer
  if (!painel) return;

  const statusEl = $("leitura-status");
  const btnOuvir = $("btn-ouvir");
  const btnPausar = $("btn-pausar");
  const btnParar = $("btn-parar");
  const btnIrTrecho = $("btn-ir-trecho");
  const inputRate = $("leitura-rate");
  const rateValor = $("leitura-rate-valor");

  // Navegador sem leitura em voz alta: esconde os botões (classe
  // .sem-suporte, veja o style.css), avisa e para por aqui
  if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
    painel.classList.add("sem-suporte");
    statusEl.textContent =
      "Seu navegador não oferece leitura em voz alta. Tente Chrome, Edge ou Safari atualizados.";
    return;
  }

  /* ---------- Estado da leitura ---------- */

  let trechos = []; // elementos que serão lidos, na ordem
  let indice = 0; // posição do trecho atual em "trechos"
  let pausado = false;
  let voz = null; // voz em português escolhida (ou null = voz padrão)
  // Fala em andamento: impede que um cancel() dispare "onend" e reinicie a leitura
  let leituraAtual = null;
  // Guardado no mousedown de Ouvir, porque o clique no botão apaga a seleção
  let elementoSelecionado = null;
  // true = a pessoa rolou na mão; o script deixa de rolar sozinho
  let usuarioRolouNaMao = false;
  // true = a rolagem atual veio do próprio script (não conta como manual)
  let rolagemDoScript = false;
  let timerRolagem;

  /* ---------- Funções: voz ---------- */

  // Recebe: nada. Faz: escolhe uma voz pt-BR (ou outra em português).
  // Devolve: nada. É chamada de novo quando a lista de vozes carrega,
  // porque alguns navegadores carregam as vozes depois da página.
  function carregarVoz() {
    const vozes = speechSynthesis.getVoices();
    voz =
      vozes.find((v) => v.lang.toLowerCase() === "pt-br") ||
      vozes.find((v) => v.lang.toLowerCase().startsWith("pt")) ||
      null;
  }

  /* ---------- Funções: coleta dos trechos e ponto de partida ---------- */

  // Recebe: um elemento. Devolve: true se ele não aparece na tela
  // (ou se é escondido do leitor de tela, ou se está no próprio painel).
  function elementoOculto(el) {
    if (el.closest("[aria-hidden='true'], .painel-leitura")) return true;
    // Sem caixas na tela = não aparece (inclui o que está dentro de um bloco
    // escondido, de um <details> fechado ou de uma janela <dialog> fechada)
    if (!el.getClientRects().length) return true;
    const estilo = getComputedStyle(el);
    return (
      estilo.display === "none" ||
      estilo.visibility === "hidden" ||
      Number(estilo.opacity) === 0
    );
  }

  // Recebe: um elemento. Devolve: o texto visível dele, sem espaços sobrando.
  function textoDoElemento(el) {
    return (el.innerText || "").replace(/\s+/g, " ").trim();
  }

  // Recebe: um elemento. Devolve: o bloco "de fora" que o contém.
  // Um <p> dentro de um <li> é lido junto com o <li>,
  // para o mesmo texto não ser lido duas vezes.
  function blocoExterno(el) {
    let bloco = el;
    let acima = bloco.parentElement?.closest(SELECTORES);
    while (acima && acima.closest("main")) {
      bloco = acima;
      acima = bloco.parentElement?.closest(SELECTORES);
    }
    return bloco;
  }

  // Recebe: nada. Devolve: a lista de trechos do <main> que têm texto
  // e estão visíveis, na ordem da página.
  function coletarTrechos() {
    const main = document.querySelector("main");
    if (!main) {
      definirStatus("Não encontrei o conteúdo principal da página para ler.");
      return [];
    }
    return [...main.querySelectorAll(SELECTORES)].filter(
      (el) => blocoExterno(el) === el && !elementoOculto(el) && textoDoElemento(el),
    );
  }

  // Recebe: nada. Devolve: o bloco de texto onde está a seleção do
  // usuário, ou null se nada estiver selecionado.
  function blocoDaSelecao() {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !String(sel).trim()) return null;

    const no = sel.anchorNode;
    const interno = (no?.nodeType === 1 ? no : no?.parentElement)?.closest(SELECTORES);
    const bloco = interno ? blocoExterno(interno) : null;
    return bloco && !elementoOculto(bloco) ? bloco : null;
  }

  // Recebe: nada. Devolve: onde começa a área útil da tela, logo abaixo
  // do cabeçalho fixo (o que fica atrás dele não conta como visível).
  function topoUtil() {
    return Math.max(0, document.querySelector("header")?.getBoundingClientRect().bottom ?? 0);
  }

  // Recebe: um elemento. Devolve: true se ele aparece agora na janela.
  function elementoVisivelNaJanela(el) {
    if (elementoOculto(el)) return false;
    const r = el.getBoundingClientRect();
    return (
      r.width > 0 &&
      r.height > 0 &&
      r.right > 0 &&
      r.left < innerWidth &&
      r.bottom > topoUtil() &&
      r.top < innerHeight
    );
  }

  // Recebe: a lista de trechos. Devolve: o índice de onde a leitura começa.
  // Prioridade: (a) seleção, (b) primeiro visível, (c) início da página.
  function indiceDeInicio(lista) {
    const alvo = elementoSelecionado || blocoDaSelecao();
    elementoSelecionado = null;

    const daSelecao = lista.indexOf(alvo);
    return daSelecao >= 0 ? daSelecao : Math.max(0, lista.findIndex(elementoVisivelNaJanela));
  }

  /* ---------- Funções: leitura ---------- */

  // Recebe: nada. Faz: para o que estiver tocando, monta a lista de
  // trechos e começa a ler. Devolve: nada. (Botão "Ouvir".)
  function ouvir() {
    leituraAtual = null;
    speechSynthesis.cancel();
    limparDestaque();
    pausado = false;
    usuarioRolouNaMao = false;
    btnIrTrecho.hidden = true;

    trechos = coletarTrechos();
    if (!trechos.length) {
      definirStatus("Não há texto para ler nesta página.");
      return;
    }

    indice = indiceDeInicio(trechos);
    definirBotoes("lendo");
    falarTrechoAtual();
  }

  // Recebe: nada. Faz: fala o trecho da posição "indice" e, quando ele
  // termina, passa para o próximo. Devolve: nada.
  function falarTrechoAtual() {
    if (indice >= trechos.length) {
      encerrar("Leitura concluída.");
      return;
    }

    const el = trechos[indice];
    const texto = textoDoElemento(el);
    destacar(el);
    definirStatus(
      "Lendo: " + (texto.length > TAMANHO_RESUMO ? texto.slice(0, TAMANHO_RESUMO) + "…" : texto),
    );

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = LANG;
    fala.rate = Number(inputRate.value) || 1;
    if (voz) fala.voice = voz;

    // Só avança se esta ainda for a fala atual (e a leitura não estiver pausada)
    const proximo = () => {
      if (pausado || fala !== leituraAtual) return;
      indice += 1;
      falarTrechoAtual();
    };
    fala.onend = proximo;
    fala.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") proximo();
    };

    leituraAtual = fala;
    speechSynthesis.speak(fala);
  }

  // Recebe: nada. Faz: pausa ou continua a leitura. Devolve: nada.
  // (Botão "Pausar"/"Continuar".)
  function pausarOuContinuar() {
    if (!speechSynthesis.speaking && !pausado) return;

    pausado = !pausado;
    if (pausado) speechSynthesis.pause();
    else speechSynthesis.resume();

    definirBotoes(pausado ? "pausado" : "lendo");
    definirStatus(pausado ? "Leitura pausada." : "Continuando a leitura.");
  }

  // Recebe: a mensagem para mostrar. Faz: para a leitura e volta tudo ao
  // estado inicial. Devolve: nada. Usada ao parar e ao terminar o texto.
  function encerrar(mensagem) {
    leituraAtual = null;
    pausado = false;
    usuarioRolouNaMao = false;
    speechSynthesis.cancel();
    limparDestaque();
    btnIrTrecho.hidden = true;
    indice = 0;
    definirBotoes("parado");
    definirStatus(mensagem);
  }

  /* ---------- Funções: destaque e rolagem ---------- */

  // Recebe: um elemento. Faz: rola suavemente até ele, marcando que a
  // rolagem é do script (não da pessoa). Devolve: nada.
  function rolarPara(el) {
    rolagemDoScript = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    clearTimeout(timerRolagem);
    timerRolagem = setTimeout(() => {
      rolagemDoScript = false;
    }, TEMPO_ROLAGEM);
  }

  // Recebe: o trecho que vai ser lido. Faz: põe a classe .leitura-atual
  // (fundo amarelo no CSS) e rola até ele, se a pessoa não rolou na mão.
  // Devolve: nada.
  function destacar(el) {
    limparDestaque();
    el.classList.add("leitura-atual");
    if (!usuarioRolouNaMao) rolarPara(el);
  }

  // Recebe: nada. Faz: tira o destaque do trecho anterior. Devolve: nada.
  function limparDestaque() {
    document.querySelector(".leitura-atual")?.classList.remove("leitura-atual");
  }

  // Recebe: nada. Faz: se a pessoa rolou durante a leitura, para de rolar
  // sozinho e mostra o botão "Ir para o trecho lido". Devolve: nada.
  function marcarRolagemManual() {
    const lendo = pausado || speechSynthesis.speaking;
    if (!lendo || rolagemDoScript) return;
    usuarioRolouNaMao = true;
    btnIrTrecho.hidden = false;
  }

  // Recebe: nada. Faz: volta a rolar até o trecho lido e retoma a rolagem
  // automática. Devolve: nada. (Botão "Ir para o trecho lido".)
  function irParaTrechoLido() {
    const atual = document.querySelector(".leitura-atual");
    if (!atual) return;

    usuarioRolouNaMao = false;
    rolarPara(atual);
    btnIrTrecho.hidden = true;
    definirStatus("Voltando ao trecho que está sendo lido.");
  }

  /* ---------- Funções: botões e mensagens ---------- */

  // Recebe: "lendo", "pausado" ou "parado". Faz: ajusta o texto do botão
  // Pausar/Continuar e habilita ou desabilita Pausar e Parar. Devolve: nada.
  function definirBotoes(estado) {
    const texto = estado === "pausado" ? "Continuar" : "Pausar";
    btnPausar.disabled = btnParar.disabled = estado === "parado";
    btnPausar.textContent = texto;
    btnPausar.setAttribute("aria-label", texto + " a leitura");
  }

  // Recebe: um texto. Faz: mostra o texto na mensagem do painel, que tem
  // role="status" (o leitor de tela anuncia). Devolve: nada.
  function definirStatus(texto) {
    statusEl.textContent = texto;
  }

  /* ---------- Eventos ---------- */

  speechSynthesis.addEventListener("voiceschanged", carregarVoz);
  // Ao sair da página, para de falar
  window.addEventListener("pagehide", () => speechSynthesis.cancel());

  btnOuvir.addEventListener("mousedown", () => {
    elementoSelecionado = blocoDaSelecao();
  });
  btnOuvir.addEventListener("click", ouvir);
  btnPausar.addEventListener("click", pausarOuContinuar);
  btnParar.addEventListener("click", () => encerrar("Leitura interrompida."));
  btnIrTrecho.addEventListener("click", irParaTrechoLido);
  inputRate.addEventListener("input", () => {
    rateValor.textContent = (Number(inputRate.value) || 1) + "x";
  });

  // Rolagem, roda do mouse, toque e teclas de navegação = “usuário afastou”
  ["scroll", "wheel", "touchmove"].forEach((tipo) =>
    window.addEventListener(tipo, marcarRolagemManual, { passive: true }),
  );
  window.addEventListener("keydown", (e) => {
    if (TECLAS_ROLAGEM.includes(e.key)) marcarRolagemManual();
  });

  /* ---------- Início ---------- */

  carregarVoz();
  definirStatus("Pronto para ouvir. A leitura começa da seleção ou do trecho visível na tela.");
})();
