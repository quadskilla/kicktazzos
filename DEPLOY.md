# Deploy do Kick Tazzos

Este projeto roda como uma aplicacao Node.js com banco SQLite. Em producao, o ponto mais importante e usar um disco persistente para `DATA_DIR`, porque ali ficam saves, perfis e salas.

## Requisitos

- Node.js 24.x
- Porta HTTP liberada pelo provedor
- Disco persistente para o SQLite

## Variaveis de ambiente

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=<porta definida pelo provedor>
DATA_DIR=/data
```

`HOST=0.0.0.0` deixa o servidor acessivel fora do container/maquina. `DATA_DIR=/data` deve apontar para um volume persistente.

### Firebase Auth opcional

O login por Google/Facebook usa Firebase Authentication. Sem estas variaveis, o jogo continua usando visitante e nome/PIN.

```text
FIREBASE_API_KEY=<config publica do app web>
FIREBASE_AUTH_DOMAIN=<seu-projeto.firebaseapp.com>
FIREBASE_PROJECT_ID=<id do projeto>
FIREBASE_APP_ID=<app id web>
FIREBASE_MESSAGING_SENDER_ID=<sender id>
FIREBASE_STORAGE_BUCKET=<bucket opcional>
FIREBASE_AUTH_PROVIDERS=google,facebook
```

No Firebase Console, ative os provedores desejados em Authentication > Sign-in method e cadastre o dominio publico do jogo em Authorized domains.

## Deploy com Docker

O repositorio ja inclui `Dockerfile`. Em producao na Railway, o volume persistente deve ser criado no dashboard; o Dockerfile nao usa a instrucao `VOLUME` porque a Railway rejeita essa instrucao no build.

```bash
docker build -t kick-tazzos .
docker run --rm -p 8025:8025 -v kick-tazzos-data:/data kick-tazzos
```

Depois abra:

```text
http://localhost:8025/
```

## Railway

Este repositorio inclui `railway.toml`, entao a Railway deve detectar:

- build por `Dockerfile`
- start command `npm start`
- healthcheck em `/api/health`
- restart em falha

### Passo a passo

1. Suba este projeto para um repositorio GitHub.
2. Na Railway, crie um novo projeto a partir desse repositorio.
3. Escolha o servico web criado.
4. Crie um Volume para esse servico.
5. Monte o Volume em `/data`.
6. Configure as variaveis:

```text
NODE_ENV=production
HOST=0.0.0.0
DATA_DIR=/data
```

`PORT` deve ficar sem valor manual: a Railway injeta essa variavel automaticamente. Se `DATA_DIR` nao for definido, o servidor tambem consegue usar `RAILWAY_VOLUME_MOUNT_PATH`, que a Railway cria quando o volume esta anexado.

### Checklist antes de divulgar o link

1. Abra a URL publica da Railway.
2. Acesse `/api/health` e confira `"environment":"production"`.
3. Crie uma sala.
4. Copie o convite.
5. Abra em outro navegador ou janela anonima.
6. Marque os dois jogadores como prontos.
7. Termine uma partida ou teste W.O.
8. Peca revanche dos dois lados.

## Outros provedores

Use qualquer provedor que aceite Docker e volume persistente. O volume precisa ficar em `/data`, ou a variavel `DATA_DIR` precisa apontar para o caminho montado.

## Teste pos-deploy

1. Acesse `/api/health`.
2. Crie uma sala em uma aba.
3. Copie o convite.
4. Abra o convite em outro navegador ou janela anonima.
5. Marque os dois jogadores como prontos.
6. Jogue ate encerrar ou teste W.O.
7. Peca revanche dos dois lados.

O link de convite usa a URL publica atual do navegador, por exemplo:

```text
https://seu-dominio.com/?lobby=ABC123
```

## Backup

Faca backup periodico do arquivo:

```text
DATA_DIR/kick-tazzos.db
```

Se o provedor usar snapshots de volume, habilite snapshots automaticos.
