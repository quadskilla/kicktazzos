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

## 3. Volume

1. No projeto, crie um Volume.
2. Anexe ao servico do jogo.
3. Mount path: `/data`.

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
