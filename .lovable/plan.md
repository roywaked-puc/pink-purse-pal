## Novo Dashboard de Indicadores

Adicionar um novo relatório visual ("Indicadores") dentro da seção **Relatórios**, mostrando a evolução de clientes e faturamento ao longo do **ano corrente** (Jan → mês atual).

### Onde fica
- Nova rota `/relatorio-indicadores`
- Novo card na página **Relatórios** (`src/pages/Relatorios.tsx`), ao lado dos relatórios existentes

### O que será exibido

**1. Cards de resumo (topo)**
- Total de clientes únicos atendidos no ano
- Faturamento total do ano
- Variação % vs. mês anterior (clientes e faturamento)

**2. Gráfico — Clientes atendidos por mês**
- Gráfico de barras (Jan a mês atual)
- Eixo Y: nº de clientes únicos com recebimento no mês
- Tooltip mostra quantidade exata + variação vs. mês anterior

**3. Gráfico — Clientes por tipo de serviço**
- Gráfico de linhas (uma linha por serviço) ou barras empilhadas, mês a mês
- Cada serviço usa sua cor cadastrada (paleta Google Calendar já existente)
- Legenda com nome do serviço

**4. Gráfico — Faturamento mês a mês**
- Gráfico de barras ou área
- Soma dos recebimentos (transações de entrada da empresa) por mês
- Linha de tendência/média opcional

### Base de cálculo (regra acordada)
"Cliente atendido no mês" = cliente que teve **transação de recebimento** (`transactions` com `type='entrada'`, `scope='empresa'`) no mês.
- Para o gráfico **por serviço**, usa-se o `appointment_id` da transação para resolver o serviço; transações sem agendamento vinculado entram em "Sem serviço".
- Cliente único: deduplica por `client_id` (ou `client_name` quando não houver id) dentro do mês.

### Layout
- Mobile-first, paleta rosa/branco do app
- Usa `recharts` (já presente em `src/components/ui/chart.tsx`)
- Header com botão voltar para Relatórios
- Cards e gráficos em grid responsivo (1 coluna mobile, 2 colunas desktop para os gráficos menores)

### Detalhes técnicos

```text
Arquivos a criar:
- src/pages/RelatorioIndicadores.tsx       (página principal)
- src/components/relatorios/IndicadoresCharts.tsx (3 gráficos)

Arquivos a editar:
- src/App.tsx                 → registrar rota protegida
- src/pages/Relatorios.tsx    → adicionar card "Indicadores"
```

Fontes de dados (hooks já existentes):
- `useTransactions()` — base para clientes atendidos e faturamento
- `useAppointments()` — para resolver `service_id` via `appointment_id`
- `useServices()` — nome e cor de cada serviço

Cálculos feitos no cliente com `useMemo`, agrupando por mês (`date-fns` já disponível). Sem novas tabelas nem migrations.

### Fora do escopo
- Exportação CSV/PDF deste relatório (pode ser adicionada depois)
- Comparativo entre anos
- Filtros avançados por serviço/cliente
