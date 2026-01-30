
## Plano: Criar Relatorio de Agendamentos

### Objetivo

Criar uma nova pagina de relatorio de agendamentos com filtros, exibicao em tabela e exportacao para PDF (paisagem) e CSV.

---

### Informacoes a Exibir

| Coluna | Campo do Appointment |
|--------|---------------------|
| Data/Hora | date |
| Cliente | clientName |
| Servico | service |
| Duracao | duration (minutos) |
| Status Confirmacao | confirmationStatus |
| Valor Total | amount |
| Valor Recebido | paidAmount |
| Valor Pendente | amount - paidAmount |
| Status Pagamento | paymentStatus |
| Observacoes | notes |

---

### Filtros Disponiveis

| Filtro | Opcoes |
|--------|--------|
| Data Inicio | Seletor de data |
| Data Fim | Seletor de data |
| Cliente | Todos / Lista de clientes |
| Servico | Todos / Lista de servicos |
| Status Confirmacao | Todos / Pendente / Confirmado / Atendido / Cancelado |
| Status Pagamento | Todos / Pago / Sinal / Nao Pago |

---

### Resumo do Periodo

Exibir totalizadores no final:
- Total de agendamentos
- Valor total esperado (soma de amount)
- Valor ja recebido (soma de paidAmount)
- Valor pendente (diferenca)
- Quantidade por status de confirmacao

---

### Arquivos a Criar/Modificar

#### 1. Criar `src/pages/RelatorioAgendamentos.tsx`

Nova pagina com:
- Filtros (datas, cliente, servico, status confirmacao, status pagamento)
- Tabela de agendamentos filtrados
- Cards de resumo
- Botoes de exportacao PDF e CSV

```typescript
// Estrutura principal
const RelatorioAgendamentos = () => {
  // States para filtros
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedClient, setSelectedClient] = useState('todos');
  const [selectedService, setSelectedService] = useState('todos');
  const [selectedConfirmation, setSelectedConfirmation] = useState('todos');
  const [selectedPayment, setSelectedPayment] = useState('todos');

  // Filtrar agendamentos
  const filteredAppointments = useMemo(() => { ... }, [...]);

  // Calcular resumo
  const summary = useMemo(() => { ... }, [filteredAppointments]);

  // Exportar PDF (paisagem)
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    // ...
  };

  // Exportar CSV
  const exportToCSV = () => { ... };

  return ( ... );
};
```

#### 2. Modificar `src/App.tsx`

Adicionar rota para o novo relatorio:

```typescript
import RelatorioAgendamentos from "./pages/RelatorioAgendamentos";

// Na definicao de rotas:
<Route path="/relatorio-agendamentos" element={
  <ProtectedRoute>
    <RelatorioAgendamentos />
  </ProtectedRoute>
} />
```

#### 3. Modificar `src/pages/Relatorios.tsx`

Adicionar link/botao para acessar o novo relatorio de agendamentos (similar ao link para RelatorioMovimentacoes).

---

### Estrutura do PDF (Paisagem)

```text
+------------------------------------------------------------------+
| RELATORIO DE AGENDAMENTOS                                         |
| Periodo: 01/01/2025 a 31/01/2025                                 |
| Filtros: Cliente: Maria | Status: Confirmado                      |
+------------------------------------------------------------------+
| Data/Hora | Cliente | Servico | Dur. | Confirmacao | Total | Rec. | Pend. | Pag. | Obs |
|-----------|---------|---------|------|-------------|-------|------|-------|------|-----|
| ...       | ...     | ...     | ...  | ...         | ...   | ...  | ...   | ...  | ... |
+------------------------------------------------------------------+
| RESUMO DO PERIODO                                                |
| Total Agendamentos: 25 | Valor Total: R$ 5.000 | Recebido: R$ 3.500 | Pendente: R$ 1.500 |
+------------------------------------------------------------------+
```

### Larguras das Colunas (paisagem = 277 unidades)

| Coluna | Largura |
|--------|---------|
| Data/Hora | 28 |
| Cliente | 35 |
| Servico | 35 |
| Duracao | 15 |
| Confirmacao | 22 |
| Valor Total | 25 |
| Recebido | 25 |
| Pendente | 25 |
| Pagamento | 18 |
| Observacoes | 45 |
| **Total** | ~273 |

---

### Estrutura do CSV

Colunas:
```
Data/Hora;Cliente;Servico;Duracao (min);Status Confirmacao;Valor Total;Valor Recebido;Valor Pendente;Status Pagamento;Observacoes
```

Ao final, adicionar linhas de resumo.

---

### Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/pages/RelatorioAgendamentos.tsx` | Criar (novo) |
| `src/App.tsx` | Adicionar rota |
| `src/pages/Relatorios.tsx` | Adicionar link de navegacao |

---

### Resultado Esperado

- Nova pagina acessivel via /relatorio-agendamentos
- Filtros funcionais para data, cliente, servico, status
- Tabela com todos os agendamentos do periodo
- Valores recebidos e pendentes claramente visiveis
- Exportacao PDF em paisagem com resumo
- Exportacao CSV completa com resumo
