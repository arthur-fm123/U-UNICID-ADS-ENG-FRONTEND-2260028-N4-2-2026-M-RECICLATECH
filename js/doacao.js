/* =========================================================
   ReciclaTech — doacao.js (formulário "Doação em dinheiro")
   Usado em: contato.html (seção #doacao-dinheiro).

   O que faz:
   - valida os campos e mostra o erro embaixo de cada um;
   - guarda um rascunho no navegador enquanto a pessoa preenche
     (localStorage, chave "rt-doacao-rascunho") e o devolve se a
     página for atualizada;
   - envia o e-mail de confirmação pelo EmailJS e mostra
     "Enviando...", sucesso ou erro;
   - guarda a data da última doação enviada ("rt-doacao-ultima").

   O handler genérico de formulários do script.js ignora este
   formulário (data-form="doacao").
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Configuração do EmailJS (preencha com os seus dados) ----------
     PUBLIC_KEY  → painel do EmailJS > Account > General > "Public Key"
     SERVICE_ID  → painel > Email Services > o serviço que você conectou
                   (ex.: Gmail) > "Service ID" (algo como "service_ab12cd3")
     TEMPLATE_ID → painel > Email Templates > o template de confirmação >
                   aba Settings > "Template ID" (algo como "template_xy98zw7")
     A Public Key pode ficar no código do site: ela foi feita para isso.
     Nunca coloque aqui a "Private Key" nem a senha do seu e-mail.
     Enquanto os valores de exemplo estiverem aqui, o formulário avisa que
     o envio não foi configurado e não perde nada do que foi digitado. */
  const PUBLIC_KEY = "tKMSOEG-WfR_5Ez0T";
  const SERVICE_ID = "service_pm2hv5d";
  const TEMPLATE_ID = "template_pm7i94p";

  // Mesmo endereço do <script> no contato.html; usado para tentar de novo
  // se a página tiver sido aberta sem internet
  const SDK_URL = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";

  /* ---------- Outras configurações ---------- */

  const CHAVE_RASCUNHO = "rt-doacao-rascunho";
  const CHAVE_ULTIMA = "rt-doacao-ultima";
  const VALOR_MINIMO = 5;
  const ESPERA_SALVAR = 400; // ms sem digitar antes de salvar o rascunho
  const TEMPO_LIMITE_ENVIO = 20000; // ms esperando a resposta do EmailJS
  const MAX_MENSAGEM = 500;

  // Textos que vão no e-mail para cada valor dos radios
  const NOMES = {
    frequencia: { unica: "Única vez", mensal: "Mensal" },
    pagamento: { pix: "PIX", boleto: "Boleto", transferencia: "Transferência" },
  };

  // E-mail: algo@algo.algo; telefone: (11) 91234-5678 ou (11) 3000-0000
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const REGEX_TEL = /^\(\d{2}\) \d{4,5}-\d{4}$/;
  // Formata números como dinheiro brasileiro: 50 → "R$ 50,00"
  const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  /* ---------- Referências aos elementos ---------- */

  const form = document.getElementById("form-doacao");
  // Página sem o formulário de doação: não há nada a fazer
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const el = {
    nome: $("doacao-nome"),
    email: $("doacao-email"),
    tel: $("doacao-tel"),
    blocoOutro: $("doacao-outro-bloco"),
    valorOutro: $("doacao-valor-outro"),
    mensagem: $("doacao-mensagem"),
    contador: $("doacao-mensagem-contador"),
    aceite: $("doacao-aceite"),
    chavePix: $("doacao-chave-pix"),
    copiarPix: $("doacao-copiar-pix"),
    copiarStatus: $("doacao-copiar-status"),
    enviar: $("doacao-enviar"),
    limpar: $("doacao-limpar"),
    status: $("doacao-status"),
    alerta: $("doacao-alerta"),
    ultima: $("doacao-ultima"),
  };

  /* ---------- Regras de validação ----------
     Cada regra diz: o nome usado na mensagem geral (rotulo), os campos que
     recebem aria-invalid, o id do parágrafo de erro e a função que confere
     o campo. A função devolve "" se está certo ou o texto do erro. */

  const REGRAS = [
    {
      nome: "nome",
      rotulo: "Nome completo",
      campos: [el.nome],
      erro: "doacao-nome-erro",
      validar: () => {
        const t = el.nome.value.trim();
        if (!t) return "Informe seu nome completo.";
        if (t.length < 3) return "O nome precisa ter pelo menos 3 caracteres.";
        return "";
      },
    },
    {
      nome: "email",
      rotulo: "E-mail",
      campos: [el.email],
      erro: "doacao-email-erro",
      validar: () => {
        const t = el.email.value.trim();
        if (!t) return "Informe seu e-mail. É para ele que enviaremos a confirmação.";
        if (!REGEX_EMAIL.test(t) || !el.email.checkValidity()) {
          return "Confira o e-mail. Exemplo: nome@exemplo.com.br";
        }
        return "";
      },
    },
    {
      nome: "tel",
      rotulo: "Telefone",
      campos: [el.tel],
      erro: "doacao-tel-erro",
      validar: () => {
        const t = el.tel.value.trim();
        return t && !REGEX_TEL.test(t)
          ? "Use o formato (11) 91234-5678 ou deixe o campo em branco."
          : "";
      },
    },
    {
      nome: "valor",
      rotulo: "Valor da doação",
      campos: radios("valor"),
      erro: "doacao-valor-erro",
      validar: () => (radioMarcado("valor") ? "" : "Escolha um valor para a doação."),
    },
    {
      nome: "valorOutro",
      rotulo: "Outro valor",
      campos: [el.valorOutro],
      erro: "doacao-outro-erro",
      validar: () => {
        if (radioMarcado("valor") !== "outro") return "";
        const t = el.valorOutro.value.trim();
        if (!t) return "Informe o valor da doação.";
        const n = converterValor(t);
        if (Number.isNaN(n)) return "Digite só números, com até 2 casas decimais. Exemplo: 35,50";
        if (n < VALOR_MINIMO) return "O valor mínimo é " + moeda.format(VALOR_MINIMO) + ".";
        return "";
      },
    },
    {
      nome: "frequencia",
      rotulo: "Frequência",
      campos: radios("frequencia"),
      erro: "doacao-frequencia-erro",
      validar: () => (radioMarcado("frequencia") ? "" : "Escolha a frequência: única vez ou mensal."),
    },
    {
      nome: "pagamento",
      rotulo: "Forma de pagamento",
      campos: radios("pagamento"),
      erro: "doacao-pagamento-erro",
      validar: () => (radioMarcado("pagamento") ? "" : "Escolha a forma de pagamento."),
    },
    {
      nome: "aceite",
      rotulo: "Concordância com o uso dos dados",
      campos: [el.aceite],
      erro: "doacao-aceite-erro",
      validar: () =>
        el.aceite.checked ? "" : "Para enviar, marque que concorda com o uso dos seus dados para contato.",
    },
  ];

  // Guarda em cada regra o parágrafo onde o erro aparece
  REGRAS.forEach((regra) => {
    regra.erroEl = $(regra.erro);
  });

  /* ---------- Estado do formulário ---------- */

  let timerRascunho = null; // espera para salvar o rascunho
  let tentouEnviar = false; // depois da 1ª tentativa, valida enquanto digita
  let enviando = false; // impede dois envios ao mesmo tempo
  let avisouOffline = false; // mostrou o aviso de "sem internet"
  let sdkIniciado = false; // emailjs.init() já foi chamado
  // Timer de cada mensagem, para uma mensagem antiga não sobrescrever a nova
  const timersTexto = new Map();

  /* ---------- Funções: localStorage ----------
     Sempre em try/catch, como no script.js: se o navegador bloquear o
     localStorage, o formulário continua funcionando (só não guarda). */

  // Recebe: a chave. Devolve: o valor guardado (já convertido de JSON)
  // ou null se não houver ou não der para ler.
  function lerStorage(chave) {
    try {
      const texto = localStorage.getItem(chave);
      return texto ? JSON.parse(texto) : null;
    } catch (e) {
      return null;
    }
  }

  // Recebe: a chave e um valor. Faz: guarda o valor em JSON. Devolve: nada.
  function gravarStorage(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {}
  }

  // Recebe: a chave. Faz: apaga o valor guardado. Devolve: nada.
  function apagarStorage(chave) {
    try {
      localStorage.removeItem(chave);
    } catch (e) {}
  }

  /* ---------- Funções: leitura dos campos ---------- */

  // Recebe: o name de um grupo de radios. Devolve: a lista desses radios.
  function radios(nome) {
    return [...form.querySelectorAll('input[type="radio"][name="' + nome + '"]')];
  }

  // Recebe: o name de um grupo de radios. Devolve: o value do marcado ("" se nenhum).
  function radioMarcado(nome) {
    const marcado = radios(nome).find((r) => r.checked);
    return marcado ? marcado.value : "";
  }

  // Recebe: o name do grupo e o value a marcar. Faz: marca esse radio
  // (e desmarca os outros). Devolve: nada.
  function marcarRadio(nome, valor) {
    radios(nome).forEach((r) => {
      r.checked = r.value === valor;
    });
  }

  // Recebe: nada. Devolve: um objeto com os campos do formulário.
  // É exatamente isto que vai para o rascunho (nada além dos campos).
  function lerFormulario() {
    return {
      nome: el.nome.value,
      email: el.email.value,
      tel: el.tel.value,
      valor: radioMarcado("valor"),
      valorOutro: el.valorOutro.value,
      frequencia: radioMarcado("frequencia"),
      pagamento: radioMarcado("pagamento"),
      mensagem: el.mensagem.value,
      aceite: el.aceite.checked,
    };
  }

  // Recebe: o texto digitado em "Outro valor". Devolve: o número, ou NaN
  // se não for um valor válido. Aceita "35", "35,5", "35,50", "35.50",
  // "1.000" e "1.000,50".
  function converterValor(texto) {
    let t = String(texto).trim().replace(/^R\$/i, "").replace(/\s/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : NaN;
  }

  // Recebe: os dados do formulário. Devolve: o valor da doação em número
  // (o radio escolhido ou o "Outro valor").
  function valorEscolhido(dados) {
    return dados.valor === "outro" ? converterValor(dados.valorOutro) : Number(dados.valor);
  }

  // Recebe: o texto do telefone. Devolve: o telefone no formato
  // (11) 91234-5678 se tiver 10 ou 11 dígitos; senão, o texto como veio.
  // (O script.js tem a mesma conta para o formulário de contato: cada
  // arquivo funciona sozinho, sem depender do outro.)
  function formatarTelefone(texto) {
    const n = texto.replace(/\D/g, "");
    if (n.length !== 10 && n.length !== 11) return texto;
    return "(" + n.slice(0, 2) + ") " + n.slice(2, -4) + "-" + n.slice(-4);
  }

  /* ---------- Funções: partes da tela que dependem das escolhas ---------- */

  // Recebe: nada. Faz: mostra o campo "Outro valor" só quando essa opção
  // está marcada (e tira o erro dele quando some). Devolve: nada.
  function atualizarOutroValor() {
    const outro = radioMarcado("valor") === "outro";
    el.blocoOutro.hidden = !outro;
    el.valorOutro.required = outro;
    if (!outro) mostrarErro(regraPorNome("valorOutro"), "");
  }

  // Recebe: nada. Faz: mostra só as instruções da forma de pagamento
  // escolhida (PIX, boleto ou transferência). Devolve: nada.
  function atualizarInstrucoes() {
    const escolhido = radioMarcado("pagamento");
    form.querySelectorAll("[data-instrucao]").forEach((bloco) => {
      bloco.hidden = bloco.dataset.instrucao !== escolhido;
    });
    el.copiarStatus.textContent = "";
  }

  // Recebe: nada. Faz: atualiza "N de 500 caracteres". Devolve: nada.
  function atualizarContador() {
    el.contador.textContent = el.mensagem.value.length + " de " + MAX_MENSAGEM + " caracteres";
  }

  // Recebe: nada. Faz: as três atualizações acima (depois de restaurar
  // o rascunho, limpar ou enviar). Devolve: nada.
  function atualizarTela() {
    atualizarOutroValor();
    atualizarInstrucoes();
    atualizarContador();
  }

  /* ---------- Funções: validação ---------- */

  // Recebe: o nome de uma regra. Devolve: a regra.
  function regraPorNome(nome) {
    return REGRAS.find((r) => r.nome === nome);
  }

  // Recebe: um campo. Devolve: a regra que confere esse campo (ou undefined).
  function regraDoCampo(campo) {
    return REGRAS.find((r) => r.campos.includes(campo));
  }

  // Recebe: uma regra e a mensagem de erro ("" = sem erro). Faz: escreve o
  // erro embaixo do campo e marca ou desmarca aria-invalid. Devolve: nada.
  // aria-invalid só aparece quando há erro (o padrão já é "não inválido").
  function mostrarErro(regra, mensagem) {
    regra.erroEl.textContent = mensagem ? "Erro: " + mensagem : "";
    regra.campos.forEach((c) => {
      if (mensagem) c.setAttribute("aria-invalid", "true");
      else c.removeAttribute("aria-invalid");
    });
  }

  // Recebe: uma regra. Faz: confere o campo e mostra o erro.
  // Devolve: true se o campo está certo.
  function validarRegra(regra) {
    const mensagem = regra.validar();
    mostrarErro(regra, mensagem);
    return !mensagem;
  }

  // Recebe: nada. Devolve: a lista das regras com erro (vazia = tudo certo).
  function validarTudo() {
    return REGRAS.filter((regra) => !validarRegra(regra));
  }

  // Recebe: nada. Faz: apaga todos os erros da tela. Devolve: nada.
  function limparErros() {
    REGRAS.forEach((regra) => mostrarErro(regra, ""));
  }

  // Recebe: uma regra com erro. Faz: põe o foco no campo dela (num grupo
  // de radios, no marcado ou no primeiro). Devolve: nada.
  function focarCampo(regra) {
    const alvo = regra.campos.find((c) => c.checked) || regra.campos[0];
    alvo.focus();
  }

  /* ---------- Funções: mensagens de status ---------- */

  // Recebe: o elemento e o texto. Faz: esvazia e só depois escreve, para
  // o leitor de tela anunciar até um texto repetido. Devolve: nada.
  function escrever(alvo, texto) {
    clearTimeout(timersTexto.get(alvo));
    alvo.textContent = "";
    if (texto) {
      timersTexto.set(
        alvo,
        setTimeout(() => {
          alvo.textContent = texto;
        }, 50),
      );
    }
  }

  // Recebe: um texto. Faz: mostra uma mensagem comum (role="status",
  // anunciada sem interromper) e apaga o alerta. Devolve: nada.
  function mostrarStatus(texto) {
    escrever(el.alerta, "");
    escrever(el.status, texto);
  }

  // Recebe: um texto. Faz: mostra um erro (role="alert", anunciado na
  // hora) e apaga a mensagem comum. Devolve: nada.
  function mostrarAlerta(texto) {
    escrever(el.status, "");
    escrever(el.alerta, texto);
  }

  // Recebe: nada. Faz: mostra "Última doação enviada em dd/mm/aaaa" se
  // houver uma guardada; senão, esconde o parágrafo. Devolve: nada.
  function mostrarUltima() {
    const ultima = lerStorage(CHAVE_ULTIMA);
    const data = ultima && typeof ultima.enviadaEm === "string" ? new Date(ultima.enviadaEm) : null;
    if (!data || Number.isNaN(data.getTime())) {
      el.ultima.hidden = true;
      return;
    }
    el.ultima.textContent = "Última doação enviada em " + data.toLocaleDateString("pt-BR") + ".";
    el.ultima.hidden = false;
  }

  /* ---------- Funções: rascunho ---------- */

  // Recebe: nada. Faz: guarda os campos agora. Devolve: nada.
  function salvarRascunho() {
    clearTimeout(timerRascunho);
    timerRascunho = null;
    gravarStorage(CHAVE_RASCUNHO, lerFormulario());
  }

  // Recebe: nada. Faz: guarda os campos depois de 400 ms sem mudanças
  // ("debounce"), em vez de gravar a cada tecla. Devolve: nada.
  function agendarRascunho() {
    clearTimeout(timerRascunho);
    timerRascunho = setTimeout(salvarRascunho, ESPERA_SALVAR);
  }

  // Recebe: nada. Faz: cancela o salvamento pendente e apaga o rascunho.
  // Devolve: nada.
  function apagarRascunho() {
    clearTimeout(timerRascunho);
    timerRascunho = null;
    apagarStorage(CHAVE_RASCUNHO);
  }

  // Recebe: nada. Faz: devolve aos campos o que estava no rascunho.
  // Devolve: true se havia algo preenchido.
  function restaurarRascunho() {
    const d = lerStorage(CHAVE_RASCUNHO);
    if (!d || typeof d !== "object") return false;

    // O localStorage pode ter sido alterado: só aceita texto, com limite de tamanho
    const texto = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
    el.nome.value = texto(d.nome, 120);
    el.email.value = texto(d.email, 254);
    el.tel.value = texto(d.tel, 16);
    el.valorOutro.value = texto(d.valorOutro, 12);
    el.mensagem.value = texto(d.mensagem, MAX_MENSAGEM);
    marcarRadio("valor", d.valor);
    marcarRadio("frequencia", d.frequencia);
    marcarRadio("pagamento", d.pagamento);
    el.aceite.checked = d.aceite === true;

    const atual = lerFormulario();
    return Object.keys(atual).some((k) => (k === "aceite" ? atual[k] : atual[k].trim() !== ""));
  }

  /* ---------- Funções: EmailJS ---------- */

  // Recebe: nada. Devolve: true se as 3 chaves do EmailJS foram preenchidas
  // (não estão vazias nem com os valores de exemplo SUA_/SEU_).
  function configurado() {
    return ![PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID].some((v) => !v || /^(SUA|SEU)_/.test(v));
  }

  // Recebe: nada. Faz: chama emailjs.init() uma vez só. Devolve: true se o
  // EmailJS está carregado e pronto.
  function iniciarSdk() {
    if (sdkIniciado || !window.emailjs) return !!window.emailjs;
    window.emailjs.init({
      publicKey: PUBLIC_KEY,
      blockHeadless: true, // ignora robôs com navegador "sem tela"
      limitRate: { id: "rt-doacao", throttle: 10000 }, // no máximo 1 envio a cada 10 s
    });
    sdkIniciado = true;
    return true;
  }

  // Recebe: nada. Devolve: uma Promise com true se o EmailJS ficou pronto.
  // Se o <script> do EmailJS não carregou (página aberta sem internet),
  // tenta carregar de novo agora.
  function garantirSdk() {
    if (window.emailjs) return Promise.resolve(iniciarSdk());
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.onload = () => resolve(iniciarSdk());
      script.onerror = () => {
        script.remove();
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  // Recebe: uma Promise e um tempo em ms. Devolve: uma Promise que dá erro
  // ({ tempoEsgotado: true }) se a primeira demorar mais que esse tempo.
  function comTempoLimite(promessa, ms) {
    let timer;
    const limite = new Promise((_, rejeitar) => {
      timer = setTimeout(() => rejeitar({ tempoEsgotado: true }), ms);
    });
    return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
  }

  // Recebe: nada. Devolve: o objeto com as variáveis do template do EmailJS
  // ({{nome}}, {{valor}} etc.). Os nomes precisam ser iguais aos do template.
  function montarDadosEmail() {
    const d = lerFormulario();
    const mensal = d.frequencia === "mensal";
    const instrucoes = {
      pix: "Chave PIX (fictícia): " + el.chavePix.textContent.trim(),
      boleto: "Em uma ONG real, o boleto seria enviado por e-mail. Neste projeto acadêmico nenhum boleto é gerado.",
      transferencia: "Em uma ONG real, os dados da conta da ReciclaTech seriam enviados por e-mail.",
    };
    return {
      to_email: d.email.trim(),
      to_name: d.nome.trim(),
      nome: d.nome.trim(),
      email: d.email.trim(),
      telefone: d.tel.trim() || "Não informado",
      valor: moeda.format(valorEscolhido(d)),
      frequencia: NOMES.frequencia[d.frequencia],
      pagamento: NOMES.pagamento[d.pagamento],
      instrucoes_pagamento: instrucoes[d.pagamento],
      mensagem: d.mensagem.trim() || "(sem mensagem)",
      data_envio: new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
      agradecimento: mensal
        ? "Muito obrigado por escolher apoiar a ReciclaTech todos os meses!"
        : "Muito obrigado por apoiar a ReciclaTech!",
    };
  }

  // Recebe: o erro do envio. Devolve: uma mensagem clara para a pessoa,
  // sempre lembrando que os dados não se perderam.
  function mensagemDeErro(erro) {
    const sufixo = " Seus dados continuam no formulário e salvos neste navegador.";
    if (erro && erro.tempoEsgotado) {
      return (
        "O serviço de e-mail demorou demais para responder. Verifique sua conexão e tente de novo. " +
        "Se o e-mail de confirmação chegar, não é preciso reenviar." +
        sufixo
      );
    }
    const codigo = erro && erro.status;
    if (codigo === 429) return "Aguarde alguns segundos antes de enviar de novo." + sufixo;
    if (!navigator.onLine || !codigo) {
      return "Não foi possível falar com o serviço de e-mail. Verifique sua conexão e tente de novo." + sufixo;
    }
    return "O serviço de e-mail recusou o envio (código " + codigo + "). Tente de novo mais tarde." + sufixo;
  }

  // Recebe: true (começou a enviar) ou false (terminou). Faz: desabilita os
  // botões e os campos, e troca o texto para "Enviando...". Devolve: nada.
  function definirEnviando(sim) {
    enviando = sim;
    el.enviar.disabled = sim;
    el.limpar.disabled = sim;
    el.enviar.textContent = sim ? "Enviando..." : "Enviar doação";
    // aria-busy avisa o leitor de tela que o formulário está ocupado
    form.setAttribute("aria-busy", sim ? "true" : "false");
    // Impede mudar os campos durante o envio
    form.querySelectorAll("fieldset").forEach((f) => {
      f.disabled = sim;
    });
  }

  // Recebe: os dados enviados. Faz: apaga o rascunho, guarda a data da
  // doação, limpa o formulário e mostra a mensagem de sucesso. Devolve: nada.
  function concluirComSucesso(dados) {
    apagarRascunho();
    gravarStorage(CHAVE_ULTIMA, { enviadaEm: new Date().toISOString() });
    form.reset();
    limparErros();
    tentouEnviar = false;
    atualizarTela();
    mostrarUltima();
    mostrarStatus(
      "Doação registrada! Enviamos a confirmação para " +
        dados.to_email +
        ". " +
        "Lembre-se: este é um projeto acadêmico e nenhuma cobrança real foi feita.",
    );
    el.status.focus();
  }

  // Recebe: o evento de envio do formulário. Faz: valida, confere a
  // configuração e a internet, e envia pelo EmailJS. Devolve: nada.
  // "async" permite usar "await": esperar a resposta sem travar a página.
  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;
    tentouEnviar = true;
    salvarRascunho();

    const invalidas = validarTudo();
    if (invalidas.length) {
      const nomes = invalidas.map((r) => r.rotulo).join(", ");
      mostrarAlerta(
        "Não foi possível enviar. Corrija " +
          (invalidas.length === 1 ? "1 campo: " : invalidas.length + " campos: ") +
          nomes +
          ".",
      );
      focarCampo(invalidas[0]);
      return;
    }

    if (!configurado()) {
      mostrarAlerta(
        "O envio de e-mail ainda não foi configurado (preencha PUBLIC_KEY, SERVICE_ID e TEMPLATE_ID no doacao.js). " +
          "Seus dados continuam salvos neste navegador.",
      );
      el.alerta.focus();
      return;
    }

    if (!navigator.onLine) {
      avisouOffline = true;
      mostrarAlerta(
        "Você está sem conexão com a internet. Seus dados continuam salvos neste navegador: " +
          "quando a conexão voltar, clique em “Enviar doação” de novo.",
      );
      el.alerta.focus();
      return;
    }

    const dados = montarDadosEmail();
    definirEnviando(true);
    mostrarStatus("Enviando sua doação, aguarde...");

    try {
      if (!(await garantirSdk())) throw { status: 0 };
      await comTempoLimite(window.emailjs.send(SERVICE_ID, TEMPLATE_ID, dados), TEMPO_LIMITE_ENVIO);
      definirEnviando(false);
      concluirComSucesso(dados);
    } catch (erro) {
      console.error("Falha no envio da doação:", erro);
      definirEnviando(false);
      mostrarAlerta(mensagemDeErro(erro));
      el.alerta.focus();
    }
  }

  // Recebe: o evento "input" ou "change" de um campo. Faz: atualiza a tela,
  // revalida o campo quando faz sentido e agenda o rascunho. Devolve: nada.
  function aoAlterar(evento) {
    const campo = evento.target;
    if (!campo.name) return;

    if (campo.name === "valor") atualizarOutroValor();
    if (campo.name === "pagamento") atualizarInstrucoes();
    if (campo === el.mensagem) atualizarContador();

    // Depois da primeira tentativa (ou se o campo já tem erro), revalida na hora
    const regra = regraDoCampo(campo);
    if (regra && (tentouEnviar || campo.getAttribute("aria-invalid") === "true")) validarRegra(regra);
    if (campo.name === "valor" && tentouEnviar) validarRegra(regraPorNome("valorOutro"));

    agendarRascunho();
  }

  // Recebe: nada. Faz: formata o telefone ao sair do campo. Devolve: nada.
  function aoSairDoTelefone() {
    const formatado = formatarTelefone(el.tel.value);
    if (formatado === el.tel.value) return;
    el.tel.value = formatado;
    if (el.tel.getAttribute("aria-invalid") === "true") validarRegra(regraPorNome("tel"));
    agendarRascunho();
  }

  // Recebe: nada. Faz: limpa o formulário e apaga o rascunho. Devolve: nada.
  // (Botão "Limpar".)
  function limparFormulario() {
    apagarRascunho();
    form.reset();
    limparErros();
    tentouEnviar = false;
    atualizarTela();
    mostrarStatus("Formulário limpo. O rascunho salvo neste navegador foi apagado.");
    el.nome.focus();
  }

  // Recebe: nada. Faz: copia a chave PIX fictícia; se o navegador não
  // deixar, seleciona o texto para a pessoa usar Ctrl+C. Devolve: nada.
  async function copiarChavePix() {
    const chave = el.chavePix.textContent.trim();
    try {
      await navigator.clipboard.writeText(chave);
      escrever(el.copiarStatus, "Chave copiada.");
    } catch (e) {
      const intervalo = document.createRange();
      intervalo.selectNodeContents(el.chavePix);
      const selecao = getSelection();
      selecao.removeAllRanges();
      selecao.addRange(intervalo);
      escrever(el.copiarStatus, "Chave selecionada. Use Ctrl+C para copiar.");
    }
  }

  /* ---------- Eventos ---------- */

  form.addEventListener("input", aoAlterar);
  form.addEventListener("change", aoAlterar);
  form.addEventListener("submit", enviar);
  el.tel.addEventListener("blur", aoSairDoTelefone);
  el.limpar.addEventListener("click", limparFormulario);
  el.copiarPix.addEventListener("click", copiarChavePix);

  // Não deixa o último trecho digitado se perder ao fechar ou trocar de aba
  window.addEventListener("pagehide", () => {
    if (timerRascunho) salvarRascunho();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && timerRascunho) salvarRascunho();
  });

  // Avisos quando a internet cai ou volta
  window.addEventListener("offline", () => {
    if (enviando) return;
    avisouOffline = true;
    mostrarStatus("Você está sem internet. Pode continuar preenchendo: o rascunho fica salvo neste navegador.");
  });
  window.addEventListener("online", () => {
    if (!avisouOffline || enviando) return;
    avisouOffline = false;
    mostrarStatus("A conexão voltou. Você já pode enviar a doação.");
  });

  /* ---------- Início ---------- */

  const recuperou = restaurarRascunho();
  atualizarTela();
  mostrarUltima();
  if (window.emailjs && configurado()) iniciarSdk();
  if (recuperou) {
    mostrarStatus("Recuperamos o rascunho que você começou a preencher. Confira os dados antes de enviar.");
  }
})();
