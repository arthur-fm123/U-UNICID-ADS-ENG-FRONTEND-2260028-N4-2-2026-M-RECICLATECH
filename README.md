# ReciclaTech ♻️💻

Projeto da disciplina de **Front-End** da **UNICID** (Universidade Cidade de São Paulo), desenvolvido em grupo em 2026.

**Site publicado:** [reciclatech.up.railway.app](https://reciclatech.up.railway.app/)

> ⚠️ A ReciclaTech é uma organização **fictícia**, criada para este trabalho acadêmico. Números de impacto, depoimentos, endereço, telefone, chave PIX e instruções de pagamento do site são **ilustrativos**. Nenhuma doação, cobrança ou coleta real é feita pelo site.

---

## Sumário

- [Problema abordado](#problema-abordado)
- [A solução proposta](#a-solução-proposta)
- [Relação com sustentabilidade e impacto social](#relação-com-sustentabilidade-e-impacto-social)
- [Páginas do site](#páginas-do-site)
- [Acessibilidade do site](#acessibilidade-do-site)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como executar](#como-executar)
- [E-mails de confirmação (EmailJS)](#e-mails-de-confirmação-emailjs)
- [Dados salvos no navegador](#dados-salvos-no-navegador)
- [Validação e testes](#validação-e-testes)
- [Equipe](#equipe)
- [Créditos](#créditos)

---

## Problema abordado

O site apresenta a ReciclaTech, uma organização sem fins lucrativos fictícia que transforma computadores descartados em ferramentas de acessibilidade para estudantes com deficiência. O projeto enfrenta dois problemas ao mesmo tempo: a exclusão digital de pessoas com deficiência e o descarte incorreto de lixo eletrônico.

**Problema social:** o Brasil tem cerca de 18,6 milhões de pessoas com deficiência (IBGE, PNAD Contínua 2022). Muitas escolas públicas não têm computadores, e as que têm raramente contam com recursos de acessibilidade, como leitores de tela, ampliadores de tela e tradução em Libras. Sem esses recursos, alunos cegos, surdos ou com deficiência motora ficam de fora das aulas de informática e perdem oportunidades de estudo e trabalho.

**Problema ambiental:** segundo o Global E-waste Monitor 2024, da ONU, o mundo gerou cerca de 62 milhões de toneladas de lixo eletrônico em 2022, e o Brasil descarta aproximadamente 2,4 milhões de toneladas por ano, sendo o maior gerador da América Latina. Parte desse volume vai para aterros e lixões, contaminando solo e água, enquanto muitos desses equipamentos ainda poderiam funcionar.

## A solução proposta

A ReciclaTech recolhe computadores e notebooks descartados, recupera os equipamentos e os adapta para pessoas com deficiência antes de doá-los a escolas públicas. O processo tem cinco etapas:

1. **Coleta:** pessoas e empresas doam equipamentos em pontos de coleta ou pedem a retirada pelo site.
2. **Triagem:** os técnicos separam o que pode ser consertado, o que vira peça de reposição e o que segue para reciclagem certificada.
3. **Recuperação:** apagamento seguro dos dados do doador, troca de peças (SSD e memória) e instalação do sistema operacional.
4. **Acessibilidade:** instalação de softwares gratuitos, como os leitores de tela NVDA e Dosvox, a Lupa do Windows, o VLibras e o teclado virtual, além de adaptações físicas, como teclas com braile e letras ampliadas, fones de ouvido e mouse do tipo trackball.
5. **Doação e capacitação:** o computador é entregue à escola, e os professores recebem uma capacitação para usar os recursos com os alunos.

**Frente de apoio – energia solar:** nos laboratórios doados, células ainda boas de baterias de notebooks descartados são testadas e reaproveitadas para armazenar energia de painéis solares, reduzindo o custo de energia das escolas.

O projeto também conta com voluntários (técnicos, instrutores e intérpretes de Libras) e oferece incentivos a doadores: dedução fiscal para empresas do lucro real (até 2% do lucro operacional, Lei 9.249/1995), certificado de descarte correto e certificado de apagamento de dados.

No site, quem quiser ajudar pode:

- **doar equipamentos** ou **se inscrever como voluntário** pelo formulário de contato;
- fazer uma **doação em dinheiro** (simulada), escolhendo valor, frequência e forma de pagamento.

Nos dois casos, a pessoa recebe um **e-mail de confirmação** (veja [E-mails de confirmação](#e-mails-de-confirmação-emailjs)).

## Relação com sustentabilidade e impacto social

- **Impacto social:** inclusão digital de pessoas com deficiência, autonomia nos estudos, educação pública, voluntariado e capacitação profissional.
- **Sustentabilidade:** reaproveitamento de eletrônicos que iriam para o lixo, reciclagem certificada, energia renovável e educação ambiental.
- **Relevância:** o tema conecta a área de formação da equipe (informática) a problemas reais do país e se inspira em iniciativas existentes, como o programa federal Computadores para Inclusão.

## Páginas do site

| Nº | Página | Arquivo | Conteúdo |
|----|--------|---------|----------|
| 1 | Início | `index.html` | Chamada principal, as 5 etapas do processo, números de impacto e convite para participar |
| 2 | Sobre | `sobre.html` | História, missão, visão e valores |
| 3 | Projetos | `projetos.html` | Projetos da ONG, o caminho "do descarte à sala de aula", vantagens de doar e funções de voluntariado |
| 4 | Impacto | `impacto.html` | Tabelas de resultados e depoimentos |
| 5 | Acessibilidade | `acessibilidade.html` | Recursos instalados nos computadores doados, recursos do site e atalhos de teclado |
| 6 | Galeria | `galeria.html` | 6 fotos com visualização ampliada |
| 7 | Mídia | `midia.html` | Vídeo com legendas, podcast com transcrição e mapa dos pontos de coleta |
| 8 | Notícias | `noticias.html` | Notícias sobre tecnologia assistiva, inclusão e descarte correto |
| 9 | Contato | `contato.html` | Formulário de contato (doar equipamentos ou ser voluntário) e doação em dinheiro |
| 10 | Orçamento de hospedagem | `orcamento-hospedagem.html` | Comparação de hospedagens e domínios para publicar o site |

## Acessibilidade do site

Como o tema do projeto é inclusão, o site foi pensado **acessível desde o início**. Recursos disponíveis em **todas as páginas**:

- **Alto contraste:** fundo preto, texto branco e destaques em amarelo. O logo também muda para a versão feita para fundo escuro. A escolha fica salva no navegador.
- **Tamanho da fonte (A-, A, A+):** de 80% a 130%. Como o CSS usa `rem`, o site inteiro acompanha, inclusive o logo.
- **Leitura em voz alta:** lê o conteúdo da página com a Web Speech API do navegador, começando pelo texto selecionado ou pelo trecho visível. O trecho lido fica destacado, e dá para pausar, parar e ajustar a velocidade.
- **Link "Pular para o conteúdo principal":** aparece ao navegar com a tecla Tab.
- **Navegação completa pelo teclado**, com foco sempre visível.
- **HTML semântico:** `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `figure`/`figcaption`, `dialog`, hierarquia de títulos correta e tabelas com `caption` e `th`.
- **ARIA só quando necessário:** `aria-current` no link da página atual, `aria-expanded` no menu, `aria-pressed` no botão de alto contraste, `aria-invalid` e `aria-describedby` nos campos com erro, e mensagens com `role="status"` e `role="alert"`.
- **Formulários acessíveis:** todo campo tem `<label>`, os grupos de opções usam `fieldset`/`legend`, os erros aparecem em texto (não só em cor) e o foco vai para o primeiro campo com erro.
- **Imagens com texto alternativo** e galeria que abre a foto ampliada numa janela que fecha com Esc e devolve o foco para a foto.
- **Vídeo com legendas** e **podcast com transcrição**.
- **Contraste mínimo AA (WCAG 2.1)**, conferido nos modos normal e de alto contraste.
- **Fonte Atkinson Hyperlegible**, criada para facilitar a leitura de pessoas com baixa visão.
- **Alvos de toque grandes** (mínimo de 48px) para quem usa o celular.
- **Layout responsivo**, testado em computador, tablet e celular.

## Tecnologias utilizadas

- **HTML5**
- **CSS3:** variáveis CSS, `@layer`, Grid, Flexbox, `:has()`, `:where()`, `color-mix()` e cores em `oklch()`. As classes utilitárias foram baseadas no Tailwind CSS e estão escritas direto no `css/style.css`, sem nenhuma etapa de build.
- **JavaScript puro** (sem frameworks).
- **[EmailJS](https://www.emailjs.com):** envio dos e-mails de confirmação direto do navegador.
- **Web Speech API:** leitura em voz alta.
- **localStorage:** guarda as preferências e o rascunho da doação.
- **Git e GitHub:** versionamento do código.
- **[Railway](https://railway.app):** hospedagem do site publicado.
- **Trello:** organização das tarefas da equipe.

O site é **estático**: não tem back-end nem banco de dados.

## Estrutura de pastas

```
reciclatech/
├── index.html                  # na raiz ficam só as 10 páginas
├── sobre.html
├── projetos.html
├── impacto.html
├── acessibilidade.html
├── galeria.html
├── midia.html
├── noticias.html
├── contato.html
├── orcamento-hospedagem.html
├── css/
│   └── style.css               # todo o CSS do site, em 11 seções comentadas
├── js/
│   ├── script.js               # alto contraste, menu, painel de ajustes e validação do formulário de contato
│   ├── tamanho.js              # botões A-, A, A+
│   ├── leitura-voz.js          # leitura em voz alta
│   ├── galeria.js              # janela da foto ampliada (galeria.html)
│   ├── doacao.js               # formulário de doação em dinheiro (contato.html)
│   └── contato.js              # e-mail do formulário de contato (contato.html)
├── docs/
│   ├── README.md               # este arquivo
│   └── LEIA-ME-doacao.md       # configuração do EmailJS (os 2 templates) e checklist de testes
├── files/
│   ├── logo-reciclatech.webp            # logo oficial (modo normal)
│   ├── logo-reciclatech-contraste.webp  # logo para fundo escuro (alto contraste)
│   ├── preview.webp                     # foto do topo da página inicial
│   └── galeria-1 … galeria-6 (.webp)    # as 6 fotos da galeria
└── media/
    ├── video.mp4               # vídeo da página Mídia
    ├── legendas.vtt            # legendas do vídeo
    └── podcast.mp3             # episódio do podcast
```

Todos os arquivos `.js` ficam dentro de uma função que se executa sozinha, com `"use strict"`, e seguem a mesma ordem: configuração → referências aos elementos → funções → eventos → início. O código está comentado em português.

## Como executar

**Online:** acesse [reciclatech.up.railway.app](https://reciclatech.up.railway.app/).

**No computador:** como o site é estático, não precisa instalar nada.

1. Clone o repositório:
   ```bash
   git clone <endereço-do-repositório>
   ```
2. Abra a pasta no **VS Code** e inicie a extensão **Live Server** (clique com o botão direito em `index.html` > *Open with Live Server*).

> Prefira abrir pelo Live Server (ou outro servidor local) em vez de dar duplo clique no arquivo. Assim o envio dos e-mails e o `localStorage` funcionam como no site publicado.

## E-mails de confirmação (EmailJS)

Os dois formulários da página de Contato enviam um **e-mail de confirmação** para a pessoa pelo EmailJS, com cópia oculta para a equipe. Cada formulário tem o seu template:

| Formulário | Arquivo | O que o e-mail confirma |
|---|---|---|
| Contato | `js/contato.js` (a validação fica no `js/script.js`) | Oferta de doação de equipamentos **ou** inscrição para o voluntariado. O assunto e o texto mudam conforme a opção marcada |
| Doação em dinheiro | `js/doacao.js` | Valor, frequência e forma de pagamento (tudo simulado) |

As chaves ficam no topo do `js/contato.js` e do `js/doacao.js`. A conta e o serviço de e-mail são os mesmos, só o template muda:

```js
const PUBLIC_KEY = "...";
const SERVICE_ID = "...";
const TEMPLATE_ID = "...";
```

O passo a passo para criar a conta, conectar o Gmail e criar os dois templates, com o texto de cada template e o checklist de testes, está em **[LEIA-ME-doacao.md](LEIA-ME-doacao.md)**. No plano gratuito do EmailJS, os dois formulários somados podem enviar até 200 e-mails por mês.

> A *Public Key* do EmailJS foi feita para ficar no código do site. **Nunca** coloque no repositório a *Private Key* nem a senha do e-mail.

## Dados salvos no navegador

| Chave do `localStorage` | Para que serve |
|---|---|
| `rt-hc` | Lembra se o alto contraste está ligado |
| `rt-fs` | Lembra o tamanho da fonte escolhido |
| `rt-doacao-rascunho` | Rascunho do formulário de doação (apagado ao enviar ou ao clicar em "Limpar") |
| `rt-doacao-ultima` | Data da última doação enviada |

O formulário de contato não guarda os dados digitados. O `js/script.js` ainda apaga o rascunho antigo `rt-contato`, de uma versão anterior do site.

O SDK do EmailJS também guarda, em `rt-doacao` e `rt-contato-envio`, só a hora do último envio de cada formulário. É isso que impede mais de um envio a cada 10 segundos.

## Validação e testes

- **HTML** validado no [W3C Nu HTML Checker](https://validator.w3.org/nu/).
- **CSS** validado no [W3C CSS Validator](https://jigsaw.w3.org/css-validator/).
- As 10 páginas foram testadas no computador, no tablet e no celular, nos modos normal e de alto contraste e com a fonte em 130%, sem erros no console.
- Os dois formulários têm um checklist de testes no [LEIA-ME-doacao.md](LEIA-ME-doacao.md): campos vazios, e-mail inválido, envio com sucesso, envio repetido, atualização da página no meio do preenchimento, "Limpar", modo offline e falha do serviço de e-mail.

## Equipe

- Allex Felix Lemos Viana
- Arthur Ferreira Magalhães
- Felipe Rocha Torres
- Henrique Vieira de Souza
- Mateus de Santana Faria
- João Victor Ferreira Cosmi

## Créditos

- Fotos da galeria geradas por IA (Google Gemini), como indicado em cada legenda.
- Fonte [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible), do Braille Institute, via Google Fonts.
- Ícones no estilo [Lucide](https://lucide.dev).
- Classes utilitárias baseadas no [Tailwind CSS](https://tailwindcss.com).

---

Projeto acadêmico, sem fins comerciais. © 2026 Equipe ReciclaTech, UNICID.
