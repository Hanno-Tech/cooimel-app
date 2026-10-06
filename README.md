# COOIMEL — App do Associado + Painel Administrativo

Portal da Cooperativa de Irrigação de Meleiro: o associado consulta e paga a taxa de irrigação
(boleto/Pix), vê avisos e a cotação do arroz; a cooperativa administra tudo em `/admin`.

Arquitetura e decisões: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) · Mockups: [`mockups/`](mockups/)

## Rodando localmente

Requisitos: Node 24, Docker.

```bash
npm install
cp .env.example .env            # ajuste se necessário
docker compose up -d            # Postgres local na porta 5433
npm run db:migrate
SEED_ADMIN_CPF=<cpf> SEED_ADMIN_SENHA=<senha> SEED_ADMIN_NOME="Seu nome" npm run db:seed
npm run db:seed-demo            # opcional: associado demo com cobranças, avisos e cotações
npm run dev
```

- App do associado: http://localhost:3000 (demo: CPF `111.444.777-35`, senha `demo1234`)
- Painel: http://localhost:3000/admin (login com o CPF/senha do seed)

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Testes unitários (regras de cobrança, FEBRABAN/Pix) |
| `npm run db:generate` | Gera migration a partir de `lib/db/schema.ts` |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:seed` | Configuração inicial + primeiro admin |
| `npm run db:seed-demo` | Dados de demonstração (idempotente) |
| `npm run db:studio` | Drizzle Studio |

## Estrutura

```
app/(auth)        login, troca de senha obrigatória no 1º acesso
app/(associado)   Telas 3–15 do mockup (PWA mobile)
app/admin         painel desktop (associados, cobranças, pagamentos, avisos, cotação, usuários, config)
app/api/webhooks  confirmação de pagamento do banco
lib/domain        regras puras (valor, multa/juros, status) — com testes
lib/payments      interface PaymentGateway + gateway mock (Cresol depois)
lib/services      consultas e casos de uso
lib/db            schema Drizzle + cliente
```

## Pagamentos (mock)

Enquanto `PAYMENT_PROVIDER=mock`, boletos e Pix são simulados (código de barras e BR Code com
formato válido). Para confirmar um pagamento: **Admin → Simulador do banco**, ou o botão
"Simular pagamento (ambiente de teste)" nas telas de boleto/Pix. O fluxo passa pelo mesmo
processamento do webhook real (assinatura + idempotência).

## Pendências conhecidas

- Logo oficial em vetor (hoje: ícone do mockup em SVG) e foto real para a tela de abertura (`public/img/splash.jpg` é provisória).
- Regras de multa/juros (configuráveis em Admin → Configurações; padrão 0%).
- Adapter Cresol (`lib/payments`).
- Deploy na Vercel: provisionar Postgres (Neon) e Vercel Blob privado (fotos) e configurar as variáveis de `.env.example`.
