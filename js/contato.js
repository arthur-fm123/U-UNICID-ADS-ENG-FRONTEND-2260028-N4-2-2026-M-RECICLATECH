/* =========================================================
   ReciclaTech — contato.js (e-mail do formulário de contato)
   Usado em: contato.html, depois do SDK do EmailJS e do doacao.js.

   O que faz:
   - quando o formulário de contato ("Doar equipamentos" ou "Ser
     voluntário") está todo certo, envia pelo EmailJS um e-mail de
     confirmação para a pessoa, com cópia oculta (Bcc) para a equipe;
   - o assunto e o texto do e-mail mudam conforme a opção marcada
     em "Quero...".

   A validação continua no script.js. Quando tudo está certo, ele
   dispara o evento "rt:formulario-valido" no formulário; este arquivo
   "segura" o evento (preventDefault) e faz o envio. Sem este arquivo,
   o script.js mostra a mensagem de demonstração, como antes.

   Este formulário usa um template DIFERENTE do da doação em dinheiro
   (doacao.js). A conta e o serviço de e-mail são os mesmos.

   Tudo fica dentro de uma função que se executa sozinha, com
   "use strict", como nos outros arquivos .js do site.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Configuração do EmailJS ----------
     PUBLIC_KEY e SERVICE_ID → os mesmos do doacao.js (mesma conta e
                               mesmo Gmail conectado).
     TEMPLATE_ID             → o do template de contato: painel do EmailJS >
                               Email Templates > o template > aba Settings >
                               "Template ID". Passo a passo em docs/LEIA-ME-doacao.md.
     Nunca coloque aqui a "Private Key" nem a senha do e-mail.
     Enquanto o TEMPLATE_ID estiver com o valor de exemplo, o formulário
     avisa que o envio não foi configurado e não apaga nada. */
  const PUBLIC_KEY = "tKMSOEG-WfR_5Ez0T";
  const SERVICE_ID = "service_pm2hv5d";
  const TEMPLATE_ID = "SEU_TEMPLATE_ID";

  /* ---------- Outras configurações ---------- */

  const TEMPO_LIMITE_ENVIO = 20000; // ms esperando a resposta do EmailJS
  const ID_LIMITE = "rt-contato-envio"; // nome do controle de 1 envio a cada 10 s

  // Textos de cada opção de "Quero..." (a chave é o value do radio no HTML)
  const TEXTOS = {
    "Doar equipamentos": {
      assunto: "Recebemos sua oferta de doação de equipamentos",
      proximos_passos:
        "Nossa equipe vai responder em até 2 dias úteis para confirmar os equipamentos, " +
        "o endereço e a data da coleta.",
      sucesso: "Pedido de doação de equipamentos enviado!",
    },
    "Ser voluntário": {
      assunto: "Recebemos sua inscrição para o voluntariado",
      proximos_passos:
        "Nossa equipe vai responder em até 2 dias úteis para explicar como funciona " +
        "o voluntariado na área que você escolheu.",
      sucesso: "Inscrição para o voluntariado enviada!",
    },
  };

  /* ---------- Referências aos elementos ---------- */

  const form = document.querySelector('form[data-form="contato"]');
  if (!form) return; // página sem o formulário de contato: nada a fazer

  const botaoEnviar = form.querySelector('button[type="submit"]');
  const botaoLimpar = form.querySelector('button[type="reset"]');
  const textoBotao = botaoEnviar.textContent; // "Enviar"

  let enviando = false; // true enquanto espera a resposta do EmailJS

  /* ---------- Funções ---------- */

  // Recebe: nada. Devolve: true se as 3 chaves foram preenchidas
  // (não estão vazias nem com os valores de exemplo SUA_/SEU_).
  function configurado() {
    return ![PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID].some((v) => !v || /^(SUA|SEU)_/.test(v));
  }

  // Recebe: o name de um campo. Devolve: o valor dele, sem espaços nas pontas
  // (nos radios, o valor do marcado; "" se nenhum estiver marcado).
  function valor(nome) {
    const campo = form.elements[nome];
    return campo ? String(campo.value || "").trim() : "";
  }

  // Recebe: uma data do <input type="date"> ("2026-11-20").
  // Devolve: a data no formato brasileiro ("20/11/2026").
  function dataBrasileira(iso) {
    return iso.split("-").reverse().join("/");
  }

  // Recebe: nada. Devolve: o objeto com as variáveis do template do EmailJS
  // ({{nome}}, {{detalhes}} etc.). Os nomes precisam ser iguais aos do template.
  function montarDadosEmail() {
    const interesse = valor("quero");
    const textos = TEXTOS[interesse] || TEXTOS["Doar equipamentos"];
    let detalhes;

    if (interesse === "Ser voluntário") {
      detalhes = "Área em que quer ajudar: " + valor("ajuda");
    } else {
      const qtd = valor("qtd");
      const data = valor("data");
      detalhes =
        "Equipamento: " +
        valor("tipo") +
        (qtd ? " (quantidade: " + qtd + ")" : "") +
        ". Data preferida para a coleta: " +
        (data ? dataBrasileira(data) : "não informada") +
        ".";
    }

    return {
      to_email: valor("email"),
      to_name: valor("nome"),
      nome: valor("nome"),
      email: valor("email"),
      telefone: valor("tel"),
      cep: valor("cep") || "Não informado",
      interesse: interesse,
      assunto: textos.assunto,
      detalhes: detalhes,
      mensagem: valor("msg") || "(sem mensagem)",
      proximos_passos: textos.proximos_passos,
      data_envio: new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
      // usado só na tela, não no e-mail
      sucesso: textos.sucesso,
    };
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

  // Recebe: o erro do envio. Devolve: uma mensagem clara para a pessoa,
  // sempre lembrando que os dados não se perderam.
  function mensagemDeErro(erro) {
    const sufixo = " Seus dados continuam no formulário.";
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
  // campos e os botões e troca o texto para "Enviando...". Devolve: nada.
  function definirEnviando(sim) {
    enviando = sim;
    botaoEnviar.disabled = sim;
    botaoLimpar.disabled = sim;
    botaoEnviar.textContent = sim ? "Enviando..." : textoBotao;
    // aria-busy avisa o leitor de tela que o formulário está ocupado
    form.setAttribute("aria-busy", sim ? "true" : "false");
    form.querySelectorAll("fieldset").forEach((f) => {
      f.disabled = sim;
    });
  }

  // Recebe: o parágrafo de status e um texto. Faz: mostra o texto e leva o
  // foco até ele, para quem usa teclado ou leitor de tela. Devolve: nada.
  function avisar(status, texto) {
    status.textContent = texto;
    status.tabIndex = -1; // permite focar o parágrafo pelo JavaScript
    status.focus();
  }

  // Recebe: o parágrafo de status do formulário (criado pelo script.js).
  // Faz: confere a configuração e a internet, e envia pelo EmailJS.
  // Devolve: nada. "async" permite esperar a resposta com "await".
  async function enviar(status) {
    if (enviando) return;

    if (!configurado()) {
      avisar(
        status,
        "O envio de e-mail deste formulário ainda não foi configurado (preencha o TEMPLATE_ID no contato.js). " +
          "Seus dados continuam no formulário.",
      );
      return;
    }

    if (!navigator.onLine) {
      avisar(
        status,
        "Você está sem conexão com a internet. Seus dados continuam no formulário: " +
          "quando a conexão voltar, clique em “Enviar” de novo.",
      );
      return;
    }

    const dados = montarDadosEmail();
    const textoSucesso = dados.sucesso;
    delete dados.sucesso;

    definirEnviando(true);
    status.textContent = "Enviando, aguarde...";

    try {
      // Sem o SDK (página aberta sem internet), cai no catch como erro de conexão
      if (!window.emailjs) throw { status: 0 };
      await comTempoLimite(
        window.emailjs.send(SERVICE_ID, TEMPLATE_ID, dados, {
          publicKey: PUBLIC_KEY,
          blockHeadless: true, // ignora robôs com navegador "sem tela"
          limitRate: { id: ID_LIMITE, throttle: 10000 }, // no máximo 1 envio a cada 10 s
        }),
        TEMPO_LIMITE_ENVIO,
      );
      definirEnviando(false);
      form.reset();
      avisar(
        status,
        textoSucesso +
          " Enviamos a confirmação para " +
          dados.to_email +
          ". Lembre-se: este é um projeto acadêmico e a ReciclaTech é uma ONG fictícia.",
      );
    } catch (erro) {
      console.error("Falha no envio do formulário de contato:", erro);
      definirEnviando(false);
      avisar(status, mensagemDeErro(erro));
    }
  }

  /* ---------- Eventos ---------- */

  // O script.js dispara este evento quando o formulário está todo certo.
  // preventDefault() avisa a ele que o envio é feito aqui (assim ele não
  // mostra a mensagem de demonstração nem limpa o formulário).
  form.addEventListener("rt:formulario-valido", (evento) => {
    evento.preventDefault();
    enviar(evento.detail.status);
  });
})();
