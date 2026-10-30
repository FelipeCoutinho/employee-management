# Gerenciador de funcionários

Aplicação web para cadastrar, consultar, listar, editar e excluir funcionários. Cada gravação e cada exclusão pede confirmação. Os dados são validados no navegador e de novo na API, antes de chegar ao banco. Dias trabalhados e horas por dia são calculados na tela e não são gravados.

A API e o frontend são aplicações independentes. Nenhuma importa arquivo da outra.

## Estrutura

```
employee-management/
├── api/          # API REST em Express. Única aplicação que acessa o MongoDB.
├── web/          # Interface em jQuery, Bootstrap e Moment. O servidor só entrega arquivos estáticos.
├── package.json  # npm workspaces, sobe as duas aplicações juntas
└── docker-compose.yml
```

- `api/` responde apenas JSON em `/api/...`. Não serve HTML nem arquivos estáticos.
- `web/` entrega a interface. Toda leitura e gravação passa pela API via HTTP.
- A lista de periodicidades chega ao frontend por `GET /api/employees/periodicities`, não por um arquivo compartilhado. As regras de validação ficam duplicadas de propósito, e os testes das duas aplicações cobrem os mesmos casos.

## Pré-requisitos

- Node.js 22 ou mais recente
- MongoDB local, ou Docker para subir o banco com `docker compose up -d`

## Instalação

Na raiz do repositório:

```bash
npm install
cp api/.env.example api/.env
cp web/.env.example web/.env
```

O `npm install` da raiz instala as dependências de `api/` e de `web/`. Os arquivos `.env` não vão para o Git.

Para o banco via Docker, na raiz:

```bash
docker compose up -d
```

## Execução

Na raiz, as duas aplicações sobem juntas:

```bash
npm run dev
```

`npm run dev` usa `node --watch` e recarrega ao salvar um arquivo. Para subir sem recarga:

```bash
npm start
```

Cada aplicação também roda sozinha, de dentro da própria pasta ou pela raiz:

```bash
npm run dev -w api
npm run dev -w web
```

- Frontend: http://localhost:8080
- API: http://localhost:3000/api/employees

Acesse o frontend por `localhost`, e não por `127.0.0.1`. O CORS compara a origem exata, e `http://localhost:8080` é diferente de `http://127.0.0.1:8080`.

## Testes

Na raiz:

```bash
npm test
```

O comando roda os testes da API e do frontend. A primeira execução baixa o binário do MongoDB usado pelo `mongodb-memory-server` (série 7.0, a mesma do `docker-compose.yml`) e precisa de internet.

Se o download falhar por falta de binário para a distribuição Linux da máquina, o que é comum em versões recentes de Ubuntu e Debian:

```bash
MONGOMS_DISTRO=ubuntu-22.04 npm test
```

## Variáveis de ambiente

`api/.env.example`:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/employee-management
CORS_ORIGIN=http://localhost:8080
```

`web/.env.example`:

```
WEB_PORT=8080
API_URL=http://localhost:3000/api
```

Não há usuário nem senha nesses exemplos. O endereço da API lido pelo navegador vem de `API_URL`: o `web/server.js` responde `GET /config.js` com `window.APP_CONFIG`, e o `index.html` carrega esse script antes do `app.js`. Trocar o endereço não exige editar código. A resposta usa `Cache-Control: no-store` para não ficar presa no cache do navegador.

## API

| Método e rota | Comportamento |
| --- | --- |
| `GET /api/employees` | Lista todos, por data de admissão ascendente e, no empate, por `_id` ascendente |
| `GET /api/employees/:id` | Retorna um. 404 se não existir. 400 se o id não tiver 24 caracteres hexadecimais |
| `POST /api/employees` | Valida, grava e retorna 201 |
| `PUT /api/employees/:id` | Substitui todos os campos. O corpo precisa vir completo. 404 se não existir |
| `DELETE /api/employees/:id` | Remove e retorna 204 sem corpo. 404 se não existir |
| `GET /api/employees/periodicities` | Lista as periodicidades permitidas |

O funcionário é `{ id, name, admissionDate, dismissalDate, workStart, workEnd, closingPeriodicity }`. `id` é o `_id` em string. `_id` e `__v` não aparecem. `dismissalDate` vem `null` quando não há demissão. Listas são um array puro, sem envelope.

Erro: `{ message }` em pt-BR. Validação: `400` e `errors: [{ field, message }]`, com `field` igual ao nome do campo. Corpo inválido ou JSON malformado: `400` só com `{ message: "Corpo da requisição inválido." }`. Falha inesperada: `500` com mensagem genérica, sem stack trace.

## Decisões técnicas

- **API e frontend separados.** Cada um tem o próprio `package.json`, dependências, `.env.example` e processo. O frontend roda em `http://localhost:8080` e a API em `http://localhost:3000`. A API habilita o pacote `cors` apenas para a origem definida em `CORS_ORIGIN`. O CORS é uma proteção do navegador: impede que páginas de outras origens leiam as respostas e, no preflight de `POST`, `PUT` e `DELETE` com JSON, impede que elas sejam enviadas. Não bloqueia clientes como `curl`. O endereço da API chega ao navegador por `/config.js`.
- **MVC por domínio.** O model é o schema Mongoose. O controller só lida com HTTP. A view é a aplicação `web/`, que consome o JSON montado pelo DTO. Dentro do domínio, o controller chama o service, o service chama o validator e devolve 404 quando o funcionário não existe, e o repository é o único lugar que acessa o MongoDB. O DTO só normaliza, filtra e formata campos.
- **Contrato das respostas.** `id` no lugar de `_id`, listas como array puro e erros de validação com `field` igual ao nome do campo do formulário.
- **MongoDB fora do ar.** O Mongoose usa `bufferCommands: false` e `serverSelectionTimeoutMS: 5000`. Com o banco parado, cada requisição que o acessa falha em até 5 segundos com 500, em vez de ficar na fila. Se a conexão inicial falha, a API registra o erro e encerra com código 1. `GET /periodicities` não acessa o banco e continua respondendo 200.
- **Datas.** São gravadas como string `YYYY-MM-DD`, não como `Date`, para o fuso não mudar o dia. A ordenação lexicográfica coincide com a ordem cronológica. Toda data é lida com `moment.utc(valor, 'YYYY-MM-DD', true)` e todo horário com `moment.utc(valor, 'HH:mm', true)`. No fuso local, um dia em que a meia-noite não existe (início do antigo horário de verão brasileiro, como 04/11/2018) vira 01:00, e a diferença até o dia seguinte dá 23 horas, que o `diff` em dias trunca para 0. Em UTC todo dia tem 24 horas. A exibição `DD/MM/YYYY` também sai do valor em UTC.
- **Nome.** Obrigatório depois do trim, com no máximo 100 caracteres, ao menos uma letra (`/\p{L}/u`, aceita acentos) e nenhum dígito (`/\p{Nd}/u`). `"!!!"` e `" - "` são rejeitados. `"José D'Ávila-Souza"` é aceito. Símbolos como `<` e `>` não são proibidos; na tela eles entram com `.text()`, então aparecem como texto e não são executados.
- **Confirmação.** O modal usa `backdrop: 'static'` e `keyboard: false`: não fecha por clique fora nem por ESC. Durante a requisição, Confirmar, Cancelar e o X ficam desabilitados, e o texto do botão passa a "Salvando..." ou "Excluindo...". Um segundo clique não dispara outra requisição. O modal só fecha quando a resposta chega, e os botões voltam a ser habilitados em seguida.
- **Troca de funcionário em edição.** Clicar em Editar em outra linha substitui o formulário, inclusive alterações não salvas, sem perguntar. Esse comportamento é aceito.
- **Dias trabalhados.** A contagem é inclusiva: o dia da admissão e o dia da demissão são dias trabalhados, então a fórmula é a diferença em dias mais 1. São dias corridos, com fins de semana e feriados. O bloco só aparece quando há demissão válida, no mesmo dia ou depois da admissão. Não há cálculo até a data de hoje para quem ainda está ativo, porque o período não terminou.
- **Expediente no mesmo dia.** Este projeto assume que o expediente acontece no mesmo dia, sem intervalos nem pausas. Por isso, hora de fim anterior à de início é rejeitada, e não é interpretada como virada da meia-noite. Horários iguais são aceitos, porque a regra proíbe apenas "anterior". `24:00` é rejeitado: o parse estrito do Moment aceitaria esse valor como meia-noite do dia seguinte, então a validação usa a regex `/^([01]\d|2[0-3]):[0-5]\d$/`.
- **Horas por dia.** O resultado usa o formato `Xh MMmin`, com as horas sem zero à esquerda e os minutos sempre com dois dígitos. Exemplos: `08:00`–`17:30` mostra `9h 30min`, `08:00`–`16:05` mostra `8h 05min` e horários iguais mostram `0h 00min`.
- **Datas futuras.** Admissão e demissão no futuro são aceitas. Dá para registrar uma contratação já acertada ou um desligamento agendado.
- **Express 5.** Erros lançados em controllers `async` chegam ao `errorHandler` sem `try/catch` e sem wrapper. No Express 4 a Promise rejeitada não era encaminhada e a requisição ficava pendurada.
- **Validação duplicada.** O frontend responde na hora e a API valida de novo antes de gravar. Os testes das duas aplicações cobrem os mesmos casos para as regras não divergirem.
- **Bibliotecas do frontend.** jQuery, Bootstrap e Moment são dependências npm, sem CDN. O servidor resolve o arquivo principal de cada pacote com `createRequire(import.meta.url).resolve('<pacote>')` e, a partir da pasta dele, entrega só esta lista: `jquery.min.js`, `bootstrap.bundle.min.js`, `bootstrap.min.css` e `moment.min.js`. Não se resolve `package.json`, porque pacotes com o campo `exports` podem bloquear esse caminho.

## Fora de escopo

- Autenticação e controle de acesso.
- Paginação e busca.
- Expediente que atravessa a meia-noite e intervalos.
- Controle de edição concorrente: se duas abas gravarem o mesmo funcionário, vale a última.
- Aviso ao trocar de funcionário com alterações não salvas.
