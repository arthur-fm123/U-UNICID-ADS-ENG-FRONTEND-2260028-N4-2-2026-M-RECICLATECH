# Doação em dinheiro: configuração do EmailJS e testes

A seção de doação está no `contato.html`, com a lógica no `doacao.js`. As chaves do EmailJS da equipe já estão no topo do `doacao.js`; os passos abaixo explicam de onde elas vieram, para refazer a configuração se for preciso.

Sobre o `localStorage`: só o formulário de doação guarda rascunho (chaves `rt-doacao-rascunho` e `rt-doacao-ultima`). As preferências do site continuam em `rt-hc` (alto contraste) e `rt-fs` (tamanho da fonte). O formulário de contato não guarda mais nada, e o `script.js` apaga o rascunho antigo `rt-contato` que tenha ficado no navegador.

---

## Como configurar o EmailJS

1. **Crie a conta** em <https://www.emailjs.com> (o plano gratuito basta para o projeto; ele tem limite mensal de envios, confira em emailjs.com/pricing).
2. **Conecte um e-mail que vai enviar as confirmações.** No painel, vá em *Email Services > Add New Service*, escolha *Gmail* (use um Gmail da equipe, não o pessoal), clique em *Connect Account*, autorize e depois em *Create Service*. Copie o **Service ID**.
3. **Crie o template** em *Email Templates > Create New Template*:
   - **Subject:** o assunto abaixo.
   - **Content:** clique em *Edit Content > Code Editor* e cole o HTML abaixo.
   - No painel lateral do template:
     - **To Email:** `{{to_email}}` (é isso que manda o e-mail para o doador)
     - **From Name:** `ReciclaTech (projeto acadêmico)`
     - **From Email:** deixe marcado *Use Default Email Address*
     - **Reply To:** um e-mail real da equipe
     - **Bcc:** `contato@reciclatech.org.br` (cópia oculta para a ONG; se quiser que o doador veja a cópia, use o campo **Cc**)
   - Salve. Na aba *Settings* do template, copie o **Template ID**.
4. **Pegue a Public Key** em *Account > General > Public Key*.
5. **Cole os 3 valores** no topo do `doacao.js`:
   ```js
   const PUBLIC_KEY = "sua_public_key";
   const SERVICE_ID = "service_xxxxxxx";
   const TEMPLATE_ID = "template_xxxxxxx";
   ```
   A Public Key pode ficar no código do site. **Nunca** coloque a *Private Key* nem a senha do Gmail.
6. **Teste** com o botão *Test It* do template e depois pelo site. Abra o site por um servidor local (por exemplo, a extensão *Live Server* do VS Code) em vez de abrir o arquivo com duplo clique.

> **Atenção:** `reciclatech.org.br` é um domínio fictício, então o Bcc para `contato@reciclatech.org.br` não chega a ninguém (vai voltar como "não entregue"). Para os testes e a apresentação, troque pelo e-mail real da equipe.

> **Segurança (vale comentar na apresentação):** como o destinatário vem do formulário (`{{to_email}}`), qualquer pessoa poderia usar o site para mandar esse e-mail de confirmação para endereços de terceiros. O `doacao.js` reduz isso com `blockHeadless` (bloqueia navegadores automatizados) e `limitRate` (1 envio a cada 10 s por navegador; o SDK guarda a hora do último envio no `localStorage`). Essas proteções barram robôs simples, não um ataque decidido. Em um site real, o e-mail sairia de um back-end.

### Template

**Assunto (Subject):**

```
Confirmação da sua doação à ReciclaTech – {{valor}} ({{frequencia}})
```

**Conteúdo (Code Editor):**

```html
<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #222; max-width: 600px;">
  <h1 style="font-size: 22px; color: #1d4d33;">Olá, {{nome}}!</h1>
  <p>{{agradecimento}}</p>

  <h2 style="font-size: 18px; color: #1d4d33;">Resumo da doação</h2>
  <ul>
    <li><strong>Valor:</strong> {{valor}}</li>
    <li><strong>Frequência:</strong> {{frequencia}}</li>
    <li><strong>Forma de pagamento:</strong> {{pagamento}}</li>
    <li><strong>Instruções:</strong> {{instrucoes_pagamento}}</li>
  </ul>

  <h2 style="font-size: 18px; color: #1d4d33;">Seus dados</h2>
  <ul>
    <li><strong>Nome:</strong> {{nome}}</li>
    <li><strong>E-mail:</strong> {{email}}</li>
    <li><strong>Telefone:</strong> {{telefone}}</li>
    <li><strong>Mensagem:</strong> {{mensagem}}</li>
  </ul>

  <p><strong>Enviado em:</strong> {{data_envio}}</p>

  <p style="padding: 12px; background: #f1f7f3; border-left: 4px solid #1d4d33;">
    <strong>Aviso:</strong> a ReciclaTech é uma organização fictícia, criada como projeto acadêmico
    da disciplina de Front-End da UNICID (2026). Nenhuma cobrança real foi feita e os dados de
    pagamento (como a chave PIX) são apenas ilustrativos.
  </p>

  <p>Com carinho,<br>Equipe ReciclaTech</p>
</div>
```

Use sempre `{{variavel}}` com **duas** chaves. Com três chaves, o EmailJS insere HTML sem tratar, e alguém poderia injetar conteúdo pelo campo de mensagem.

### Variáveis enviadas pelo `doacao.js`

| Variável | Exemplo |
|---|---|
| `to_email` | maria@exemplo.com.br |
| `to_name`, `nome` | Maria Teste |
| `email` | maria@exemplo.com.br |
| `telefone` | (11) 91234-5678 ou "Não informado" |
| `valor` | R$ 1.250,75 |
| `frequencia` | Única vez / Mensal |
| `pagamento` | PIX / Boleto / Transferência |
| `instrucoes_pagamento` | Chave PIX (fictícia): chave-pix-exemplo@reciclatech.org.br |
| `mensagem` | texto ou "(sem mensagem)" |
| `data_envio` | 12/11/2026, 19:02 |
| `agradecimento` | texto de agradecimento (muda para doação mensal) |

---

## Checklist de testes

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 1 | Campos vazios | Clique em "Enviar doação" sem preencher | Alerta "Corrija 6 campos: …", erros embaixo de cada campo, bordas vermelhas, foco no Nome. Telefone e Mensagem **não** acusam erro. |
| 2 | E-mail inválido | Digite `maria@` | "Erro: Confira o e-mail…". Ao corrigir, o erro some enquanto você digita. |
| 3 | Outro valor | Marque "Outro valor" e digite `3,50` | Erro "O valor mínimo é R$ 5,00". `35,50` e `1.250,75` são aceitos. |
| 4 | Telefone | Digite `11912345678` e saia do campo | Vira `(11) 91234-5678`. |
| 5 | PIX | Marque PIX | Aparece a chave fictícia e o botão "Copiar chave PIX". Boleto e Transferência mostram os próprios textos. |
| 6 | Atualizar no meio | Preencha metade, espere 1 s e aperte F5 | Todos os campos voltam, inclusive radios, checkbox, Outro valor e bloco PIX, com o aviso "Recuperamos o rascunho…". |
| 7 | Sem configurar | Copie as 3 chaves do topo do `doacao.js` para um bloco de notas, troque-as por `"SUA_PUBLIC_KEY"`, `"SEU_SERVICE_ID"` e `"SEU_TEMPLATE_ID"`, recarregue a página e envie. **Depois, coloque as chaves reais de volta.** | Alerta pedindo para configurar. Nada é apagado. |
| 8 | Envio com sucesso | Configure o EmailJS e envie | Botão "Enviando..." desabilitado; depois "Doação registrada! Enviamos a confirmação para …". O form é limpo, o rascunho some e aparece "Última doação enviada em dd/mm/aaaa". O e-mail chega com todos os dados. |
| 9 | Envio duplo rápido | Envie de novo em menos de 10 s | "Aguarde alguns segundos antes de enviar de novo." Os dados ficam. |
| 10 | Limpar | Preencha e clique em "Limpar" | Campos zerados, rascunho apagado (F5 não traz nada de volta), foco no Nome. |
| 11 | Modo offline | DevTools > Network > *Offline* e enviar | Alerta "Você está sem conexão…". Os dados continuam lá. Ao voltar para *Online*: "A conexão voltou…". |
| 12 | Falha do serviço | DevTools > Network > bloquear `api.emailjs.com` e enviar | Alerta de erro claro. Os dados e o rascunho continuam lá. |
| 13 | Teclado | Use só Tab, setas e Espaço | Dá para preencher e enviar tudo, sempre com o foco visível. |
| 14 | Alto contraste | Ligue "Alto contraste" | Legendas brancas, erros e seleção em amarelo. |
| 15 | Fonte | A+ até 130% e tela de celular | Nada corta ou se sobrepõe, e os botões continuam grandes. |
| 16 | Leitura em voz alta | Selecione "Doação em dinheiro" e clique em Ouvir | Lê o título, aviso, legendas, nomes dos campos, opções e dicas. Não lê instruções escondidas. |
| 17 | Formulário de contato | Envie o formulário de contato vazio | "Corrija 5 campo(s) obrigatório(s) ou com formato inválido: Quero, Nome completo, …", com o foco no primeiro campo. Ao atualizar a página, ele **não** volta preenchido. |
