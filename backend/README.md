# Gastos Backend — Node.js + TypeScript + JWT + SQLite

API REST para o app de controle de gastos pessoais.  
Desenvolvido para rodar em **Mac Mini M4** e ser consumido por um app **Flutter iOS**.

---

## Stack

| Camada         | Tecnologia                                         |
|----------------|----------------------------------------------------|
| Linguagem      | TypeScript 5 (strict mode)                         |
| Servidor       | Express 4                                          |
| Autenticação   | JWT (jsonwebtoken) + bcryptjs                      |
| Banco de dados | SQLite via sql.js (puro JS, sem compilação nativa) |
| Validação      | express-validator                                  |

---

## Instalação e execução

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de variáveis de ambiente
cp .env.example .env

# 3. Gerar uma chave JWT segura e colar no .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Modo desenvolvimento (hot reload)
npm run dev

# 5. Build de produção
npm run build
npm start
```

---

## Variáveis de ambiente (.env)

| Variável       | Descrição                        | Padrão |
|----------------|----------------------------------|--------|
| PORT           | Porta do servidor                | 3000   |
| JWT_SECRET     | Chave secreta para assinar JWTs  | —      |
| JWT_EXPIRES_IN | Validade do token                | 7d     |

---

## Endpoints

### Auth (públicos)

| Método | Rota            | Body                          | Retorno           |
|--------|-----------------|-------------------------------|-------------------|
| POST   | /auth/register  | name, email, password         | token + user      |
| POST   | /auth/login     | email, password               | token + user      |
| GET    | /auth/me        | —                             | user (JWT)        |

### Transactions (todas exigem `Authorization: Bearer <token>`)

| Método | Rota                              | Descrição                       |
|--------|-----------------------------------|---------------------------------|
| GET    | /transactions                     | Lista com saldo calculado       |
| POST   | /transactions                     | Cria transação                  |
| GET    | /transactions/:id                 | Busca por ID                    |
| PUT    | /transactions/:id                 | Atualiza                        |
| DELETE | /transactions/:id                 | Exclui                          |
| GET    | /transactions/summary/by-category | Totais agrupados por categoria  |

### Filtros — GET /transactions

```text
?type=income|expense
?category=Alimentação
?from=2026-01-01
?to=2026-04-30
```

---

## Testando com o simulador iOS

O simulador iOS e o Mac compartilham o mesmo `localhost`.  
No Flutter, use:

```dart
// Simulador iOS
static const String baseUrl = 'http://localhost:3000';

// Dispositivo físico iOS na mesma rede Wi-Fi
// Descubra o IP do Mac: Preferências do Sistema → Wi-Fi → Detalhes
static const String baseUrl = 'http://192.168.1.XXX:3000';
```

> **Atenção:** Apps iOS em produção (App Store) exigem HTTPS.  
> Para testes locais, adicione no `Info.plist` do projeto Flutter:
>
> ```xml
> <key>NSAppTransportSecurity</key>
> <dict>
>   <key>NSAllowsArbitraryLoads</key>
>   <true/>
> </dict>
> ```

---

## Estrutura de arquivos

```text
gastos-ts-backend/
├── src/
│   ├── types/
│   │   └── index.ts              ← todas as interfaces TypeScript
│   ├── config/
│   │   └── database.ts           ← SQLite + migrations + helpers tipados
│   ├── middleware/
│   │   └── auth.ts               ← validação JWT
│   ├── controllers/
│   │   ├── authController.ts     ← register / login / me
│   │   └── transactionController.ts ← CRUD + summary
│   ├── routes/
│   │   ├── auth.ts               ← /auth/*
│   │   └── transactions.ts       ← /transactions/*
│   ├── app.ts                    ← criação e config do Express
│   └── server.ts                 ← bootstrap + listen
├── data/
│   └── gastos.db                 ← banco SQLite (gerado automaticamente)
├── dist/                         ← JS compilado (gerado pelo tsc)
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

---

## Integração Flutter — pubspec.yaml

```yaml
dependencies:
  dio: ^5.4.0
  flutter_secure_storage: ^9.0.0
```

### Uso básico no Flutter

```dart
final api = ApiService();

// Cadastro
await api.register(name: 'João', email: 'joao@email.com', password: 'senha123');

// Login
await api.login(email: 'joao@email.com', password: 'senha123');

// Listar transações com saldo
final data = await api.getTransactions(from: '2026-04-01', to: '2026-04-30');
final transactions = data['transactions'];
final balance      = data['summary']['balance'];

// Criar despesa
await api.createTransaction(
  type: 'expense',
  amount: 89.90,
  category: 'Alimentação',
  date: '2026-04-27',
  description: 'Restaurante',
);

// Gráfico por categoria
final summary = await api.getSummaryByCategory();
```
