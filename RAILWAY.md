# Railway: checklist rapido

Use este arquivo como roteiro curto no painel da Railway.

## 1. Criar projeto

1. Abra a Railway.
2. New Project.
3. Deploy from GitHub repo.
4. Selecione o repositorio do Kick Tazzos.

O arquivo `railway.toml` ja configura Dockerfile, start command e healthcheck.

## 2. Variaveis

Em Variables, adicione:

```text
NODE_ENV=production
HOST=0.0.0.0
DATA_DIR=/data
```

Nao defina `PORT`. A Railway define `PORT` automaticamente.

### Firebase Auth opcional

O login por Google usa Firebase Authentication. O deploy de Kick Tazzos ja inclui a configuracao publica do projeto `tazzostrike`; estas variaveis so sao necessarias se voce quiser trocar de projeto Firebase ou ativar outros provedores.

```text
FIREBASE_API_KEY=<config publica do app web>
FIREBASE_AUTH_DOMAIN=<seu-projeto.firebaseapp.com>
FIREBASE_PROJECT_ID=<id do projeto>
FIREBASE_APP_ID=<app id web>
FIREBASE_MESSAGING_SENDER_ID=<sender id>
FIREBASE_STORAGE_BUCKET=<bucket opcional>
FIREBASE_AUTH_PROVIDERS=google
```

No Firebase Authentication, adicione o dominio publico do jogo em Authorized domains, por exemplo `www.tazzostrike.com.br`.

### Mercado Pago

Em Variables, adicione tambem:

```text
MERCADO_PAGO_ACCESS_TOKEN=<access token de producao do Mercado Pago>
PUBLIC_BASE_URL=https://seu-dominio.com
MERCADO_PAGO_WEBHOOK_SECRET=<secret opcional do webhook>
```

No Mercado Pago Developers, configure o webhook de `payments` para:

```text
https://seu-dominio.com/api/mercadopago/webhook
```

## 3. Volume

1. No projeto, crie um Volume.
2. Anexe ao servico do jogo.
3. Mount path: `/data`.

O volume e configurado no painel da Railway. O Dockerfile nao deve conter `VOLUME ["/data"]`, porque a Railway rejeita essa instrucao durante o build.

O SQLite ficara em:

```text
/data/kick-tazzos.db
```

## 4. Dominio

1. Abra Settings do servico.
2. Gere um Railway Domain.
3. Use essa URL para testar convites.

## 5. Teste

1. Acesse `https://seu-app.up.railway.app/api/health`.
2. Confirme `ok: true` e `environment: production`.
3. Crie sala.
4. Copie convite.
5. Abra o convite em outro navegador.
6. Jogue, encerre, teste revanche.

## 6. Backup

Use backups/snapshots do volume sempre que possivel. O arquivo importante e:

```text
/data/kick-tazzos.db
```
