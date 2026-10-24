/**
 * Leitura em voz alta (Web Speech API).
 * Começa da seleção do usuário, do primeiro trecho visível ou do início de <main>.
 */
(function () {
  "use strict";

  const LANG = "pt-BR";
  const SELECTORES = "h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, dt, dd";
  const TECLAS_ROLAGEM = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
  const $ = (id) => document.getElementById(id);

  let painel, statusEl, btnOuvir, btnPausar, btnParar, btnIrTrecho, inputRate, rateValor;
  let trechos = [];
  let indice = 0;
  let pausado = false;
  let voz = null;
  // Fala em andamento: impede que um cancel() dispare "onend" e reinicie a leitura
  let leituraAtual = null;
  // Guardado no mousedown de Ouvir, porque o clique no botão apaga a seleção
  let elementoSelecionado = null;
  // true = a pessoa rolou na mão; o script deixa de rolar sozinho
  let usuarioRolouNaMao = false;
  // true = a rolagem atual veio do próprio script (não conta como manual)
  let rolagemDoScript = false;
  let timerRolagem;

  document.addEventListener("DOMContentLoaded", iniciar);

  function iniciar() {
    painel = $("painel-leitura");
    statusEl = $("leitura-status");
    btnOuvir = $("btn-ouvir");
    btnPausar = $("btn-pausar");
    btnParar = $("btn-parar");
    btnIrTrecho = $("btn-ir-trecho");
    inputRate = $("leitura-rate");
    rateValor = $("leitura-rate-valor");

    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
      painel.classList.add("sem-suporte");
      definirStatus("Seu navegador não oferece leitura em voz alta. Tente Chrome, Edge ou Safari atualizados.");
      return;
    }

    carregarVoz();
    speechSynthesis.addEventListener("voiceschanged", carregarVoz);

    btnOuvir.addEventListener("mousedown", () => { elementoSelecionado = blocoDaSelecao(); });
    btnOuvir.addEventListener("click", ouvir);
    btnPausar.addEventListener("click", pausarOuContinuar);
    btnParar.addEventListener("click", () => encerrar("Leitura interrompida."));
    btnIrTrecho.addEventListener("click", irParaTrechoLido);
    inputRate.addEventListener("input", () => {
      rateValor.textContent = (Number(inputRate.value) || 1) + "x";
    });

    // Rolagem, roda do mouse, toque e teclas de navegação = “usuário afastou”
    ["scroll", "wheel", "touchmove"].forEach((tipo) =>
      window.addEventListener(tipo, marcarRolagemManual, { passive: true })
    );
    window.addEventListener("keydown", (e) => {
      if (TECLAS_ROLAGEM.includes(e.key)) marcarRolagemManual();
    });

    definirStatus("Pronto para ouvir. A leitura começa da seleção ou do trecho visível na tela.");
  }

  /* ---------- Voz ---------- */

  function carregarVoz() {
    const vozes = speechSynthesis.getVoices();
    voz =
      vozes.find((v) => v.lang.toLowerCase() === "pt-br") ||
      vozes.find((v) => v.lang.toLowerCase().startsWith("pt")) ||
      null;
  }

  /* ---------- Coleta e ponto de partida ---------- */

  function elementoOculto(el) {
    if (el.closest("[aria-hidden='true'], .painel-leitura")) return true;
    const estilo = getComputedStyle(el);
    return estilo.display === "none" || estilo.visibility === "hidden" || Number(estilo.opacity) === 0;
  }

  function textoDoElemento(el) {
    return (el.innerText || "").replace(/\s+/g, " ").trim();
  }

  function coletarTrechos() {
    const main = document.querySelector("main");
    if (!main) {
      definirStatus("Não encontrei o conteúdo principal da página para ler.");
      return [];
    }
    return [...main.querySelectorAll(SELECTORES)].filter(
      (el) => !elementoOculto(el) && textoDoElemento(el)
    );
  }

  // Bloco de texto onde está a seleção do usuário (ou null)
  function blocoDaSelecao() {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !String(sel).trim()) return null;

    const no = sel.anchorNode;
    const bloco = (no?.nodeType === 1 ? no : no?.parentElement)?.closest(SELECTORES);
    return bloco && !elementoOculto(bloco) ? bloco : null;
  }

  // Topo da área útil: logo abaixo da navbar fixa
  function topoUtil() {
    return Math.max(0, document.querySelector("header")?.getBoundingClientRect().bottom ?? 0);
  }

  function elementoVisivelNaJanela(el) {
    if (elementoOculto(el)) return false;
    const r = el.getBoundingClientRect();
    return (
      r.width > 0 && r.height > 0 &&
      r.right > 0 && r.left < innerWidth &&
      r.bottom > topoUtil() && r.top < innerHeight
    );
  }

  // Prioridade: (a) seleção, (b) primeiro visível, (c) início da página
  function indiceDeInicio(lista) {
    const alvo = elementoSelecionado || blocoDaSelecao();
    elementoSelecionado = null;

    const daSelecao = lista.indexOf(alvo);
    return daSelecao >= 0 ? daSelecao : Math.max(0, lista.findIndex(elementoVisivelNaJanela));
  }

  /* ---------- Leitura ---------- */

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

  function falarTrechoAtual() {
    if (indice >= trechos.length) {
      encerrar("Leitura concluída.");
      return;
    }

    const el = trechos[indice];
    const texto = textoDoElemento(el);
    destacar(el);
    definirStatus("Lendo: " + (texto.length > 90 ? texto.slice(0, 90) + "…" : texto));

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = LANG;
    fala.rate = Number(inputRate.value) || 1;
    if (voz) fala.voice = voz;

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

  function pausarOuContinuar() {
    if (!speechSynthesis.speaking && !pausado) return;

    pausado = !pausado;
    if (pausado) speechSynthesis.pause();
    else speechSynthesis.resume();

    definirBotoes(pausado ? "pausado" : "lendo");
    definirStatus(pausado ? "Leitura pausada." : "Continuando a leitura.");
  }

  // Usada ao parar e ao terminar o texto
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

  /* ---------- Destaque e rolagem ---------- */

  function rolarPara(el) {
    rolagemDoScript = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    clearTimeout(timerRolagem);
    timerRolagem = setTimeout(() => { rolagemDoScript = false; }, 700);
  }

  function destacar(el) {
    limparDestaque();
    el.classList.add("leitura-atual");
    if (!usuarioRolouNaMao) rolarPara(el);
  }

  function limparDestaque() {
    document.querySelector(".leitura-atual")?.classList.remove("leitura-atual");
  }

  function marcarRolagemManual() {
    const lendo = pausado || speechSynthesis.speaking;
    if (!lendo || rolagemDoScript) return;
    usuarioRolouNaMao = true;
    btnIrTrecho.hidden = false;
  }

  function irParaTrechoLido() {
    const atual = document.querySelector(".leitura-atual");
    if (!atual) return;

    usuarioRolouNaMao = false;
    rolarPara(atual);
    btnIrTrecho.hidden = true;
    definirStatus("Voltando ao trecho que está sendo lido.");
  }

  /* ---------- Interface ---------- */

  function definirBotoes(estado) {
    const texto = estado === "pausado" ? "Continuar" : "Pausar";
    btnPausar.disabled = btnParar.disabled = estado === "parado";
    btnPausar.textContent = texto;
    btnPausar.setAttribute("aria-label", texto + " a leitura");
  }

  function definirStatus(texto) {
    statusEl.textContent = texto;
  }
})();
