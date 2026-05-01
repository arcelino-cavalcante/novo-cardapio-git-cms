# Mapa do Projeto: Cardápio Digital & KDS v3.0

Este documento serve como um **Manual Técnico Completo** para entender, manter e evoluir o sistema. Ele foi desenhado para que qualquer Desenvolvedor ou IA possa assumir o projeto imediatamente.

---

## 1. Visão Geral da Arquitetura

O sistema é um **Web App Híbrido** focado em performance, utilizando arquitetura Serverless.

*   **Frontend**: Vanilla JavaScript (ES6+), HTML5, TailwindCSS (via CDN).
*   **Backend**: Vercel Serverless Functions (Node.js) para processamento seguro.
*   **Database**: Google Firebase Firestore (NoSQL).
*   **Impressão**: Node.js `escpos-network` via Serverless Function.

---

## 2. Estrutura de Arquivos

```text
/
├── index.html              # App do Cliente (Cardápio, Carrinho, Histórico)
├── admin.html              # Painel Administrativo (KDS, Dashboard, Produtos)
├── print.html              # (Legado) Layout Térmico antigo
├── firestore.rules         # Regras de Segurança
├── package.json            # Dependências (escpos, firebase)
├── .env                    # Variáveis (MP_ACCESS_TOKEN, PRINTER_IP)
│
├── js/
│   ├── app.js              # Lógica Cliente (Carrinho, Pagamento, Histórico)
│   ├── admin.js            # Lógica Admin (KDS, Auto-Print, Dashboard)
│   ├── payment.js          # Módulo de Pagamento (Polling Pix)
│   └── firebase-config.js  # Configuração Firebase Centralizada
│
└── api/                    # Serverless Functions (Backend)
    ├── create-pix.js       # Gera Pix via Mercado Pago
    ├── check-status.js     # Consulta Status Pix
    └── print-job.js        # [NOVO] Conecta na Impressora Térmica de Rede
```

---

## 3. Fluxos de Dados (Data Flow)

### A. Fluxo de Pedido
1.  **Checkout**: Cliente escolhe Entrega (Local/Vila/Sítio) e Pagamento (Pix/Cartão/Dinheiro).
2.  **Pix**: Gera QR Code -> Polling -> Aprovação Automática.
3.  **Offline (Cartão/Dinheiro)**: Salva pedido direto com status `approved`.
4.  **Limpeza**: Ao finalizar, o **Carrinho é zerado** imediatamente.
5.  **Histórico**: Pedido aparece na aba "Pedidos" (Salvo em `localStorage` com reset diário).

### B. Sistema de Cozinha (KDS)
1.  **Abas**:
    *   **Pagos / Impressos**: Pedidos prontos para produção.
    *   **Em Análise**: Pedidos que precisam de confirmação manual.
2.  **Impressão Automática**:
    *   Assim que um pedido entra como `paid` ou `approved` (e ainda não foi impresso), o sistema chama `/api/print-job` silenciosamente.
3.  **Dashboard**: Aba com métricas de vendas do dia (Faturamento, Qtd, Ticket Médio).

### C. Impressão Térmica (/api/print-job)
1.  Recebe JSON do pedido.
2.  Conecta via TCP na impressora (IP no `.env`).
3.  Formata cupom 58mm/80mm com:
    *   Método de Pagamento (PIX, DINHEIRO + Troco).
    *   Dados do Cliente (WhatsApp e Endereço condicional).
    *   Itens com Categoria (ex: [PIZZA]).

---

## 4. Integrações Chave

### Firebase Firestore
*   **Coleção `orders`**:
    *   `status`: 'waiting_payment', 'paid', 'approved', 'cancelled'.
    *   `printed`: boolean (controle de auto-print).
    *   `history`: array de logs.

### Vercel Serverless (API)
*   **Impressão de Rede**: A Vercel (ou servidor local) deve ter acesso à rede da impressora. Em produção, recomenda-se um túnel ou rodar o backend na mesma rede (Localhost).

---

## 5. Guia para Melhorias Futuras

1.  **Webhooks do Mercado Pago**: Substituir o polling `check-status.js` por um webhook real para maior confiabilidade.
2.  **Autenticação Admin**: Implementar login real no KDS.
3.  **Relatórios Avançados**: Exportar CSV de vendas mensais.

---
**Atualizado por Antigravity Agent em 07/01/2026**
