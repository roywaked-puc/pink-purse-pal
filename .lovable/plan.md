## Módulo de Anamnese Digital — Plano de Implementação

Módulo completo de prontuário digital com modelos personalizáveis, perguntas dinâmicas, assinatura digital, versionamento e geração de PDF.

---

### 1. Nomenclatura e Navegação

- **Nome do menu:** "Prontuário" (permite agrupar Anamneses + Fotos + Evolução no futuro).
- Adicionar item no `BottomNav` substituindo ou complementando algum item atual. Como já temos 6 itens (Início, Movim., Agenda, CRM, Relat., Config), proponho:
  - Manter os 6 atuais e **acessar Prontuário via ficha da cliente + Configurações** (sem ocupar slot do menu inferior, que está cheio).
  - Alternativa: adicionar rota `/prontuario` acessível pelo menu "Mais" futuro.
- Acesso principal será via **aba "Anamneses" na ficha da cliente** + **Configurações → Modelos de Anamnese**.

### 2. Modelo de Dados (Lovable Cloud)

```text
anamnese_templates              (modelo lógico, agrupa versões)
├── id, user_id, name, description, active, created_at, updated_at

anamnese_template_versions      (versão imutável após uso)
├── id, template_id, version (int), is_current, locked (bool)
├── created_at

anamnese_questions              (perguntas por versão)
├── id, version_id, section, label, type, options (jsonb),
├── required, order_index

anamnese_responses              (uma resposta por preenchimento)
├── id, user_id, client_id, template_id, version_id,
├── status ('pendente'|'preenchida'|'assinada'|'arquivada'),
├── filled_at, signed_at, signature_data (text, base64 PNG),
├── pdf_path (storage), share_token (uuid, para link futuro)

anamnese_answers                (respostas individuais)
├── id, response_id, question_id, value (jsonb)
```

Tipos de pergunta: `texto_curto`, `texto_longo`, `sim_nao`, `multipla_escolha`, `selecao_unica`, `data`, `numero`, `checkbox`.

Regra de **versionamento**: ao editar um modelo que já tem `anamnese_responses` vinculadas àquela versão, criar nova versão (clone de perguntas) e marcar a antiga como `locked=true`. Versão sem uso pode ser editada livremente.

Storage: novo bucket privado `anamnese-pdfs` para armazenar PDFs assinados.

### 3. Configurações → Modelos de Anamnese

Novo `AccordionItem` em `Configuracoes.tsx` com:
- Lista de modelos (ativos/inativos).
- Criar / editar modelo (nome, descrição, status).
- Editor de perguntas dinâmico: arrastar ordem, agrupar por seção, escolher tipo, definir opções (para múltipla/única), marcar obrigatória.
- Botão "Duplicar modelo" e "Nova versão".
- **Seed inicial automático** na primeira visita: criar modelo "Anamnese Lash Lifting v1" com as seções e perguntas descritas (Dados Pessoais, Histórico, Alergias, Saúde Geral, Saúde Ocular, Medicamentos, Termo de Consentimento).

### 4. Ficha da Cliente — Nova Aba "Anamneses"

Em `ClienteFicha.tsx`, adicionar nova aba após "Fotos":
- Botão **"Nova Anamnese"** → escolhe modelo ativo → abre formulário.
- Lista de anamneses preenchidas: nome, data, versão, status (badge), ações (visualizar / baixar PDF / arquivar).
- **Alerta** "⚠ Cliente sem anamnese preenchida" quando lista vazia.

### 5. Tela de Preenchimento

Componente `AnamneseForm`:
- Renderiza perguntas agrupadas por seção, com componente apropriado por tipo.
- Validação de obrigatórias com Zod.
- Salvar rascunho (status `preenchida`) ou seguir para assinatura.
- **Assinatura digital:** componente `SignaturePad` em canvas (touch + mouse). Botões "Limpar" e "Confirmar". Salva PNG base64 em `signature_data`.
- Após confirmar assinatura → status vira `assinada`, marcar versão como `locked`, disparar geração de PDF.

### 6. Geração de PDF

Edge function `generate-anamnese-pdf`:
- Recebe `response_id`.
- Busca dados (cliente, modelo, perguntas, respostas, assinatura).
- Gera PDF (via `npm:pdf-lib` ou HTML→PDF) com cabeçalho, perguntas, respostas, termo, assinatura, data, versão.
- Faz upload ao bucket `anamnese-pdfs/{user_id}/{response_id}.pdf`.
- Atualiza `pdf_path` na resposta.

Front-end: botões Visualizar (signed URL), Baixar, Imprimir.

### 7. Congelamento e Versionamento

- Após `signed_at` preenchido → backend bloqueia updates em `anamnese_answers` e na própria resposta via policy/regra.
- Edição de modelo com versão `locked=true` força criação de nova versão.

### 8. CRM — Indicador "Sem Anamnese"

Adicionar novo `ActionCard` em `pages/CRM.tsx`:
- "Clientes sem Anamnese" → lista clientes ativos sem `anamnese_responses` com status `assinada`.
- Hook em `useCrm.ts` para calcular.

### 9. Link Seguro (estrutura futura)

- Campo `share_token` (uuid) já criado no schema.
- Rota `/anamnese/:token` mock que apenas exibe placeholder por ora.
- Implementação completa (RLS pública via token + página de preenchimento sem auth) será incremento futuro.

### 10. Arquivos a criar/editar

**Migração:** `supabase/migrations/<ts>_anamnese.sql` — tabelas, GRANTs, RLS por `auth.uid()`, bucket via tool.

**Edge function:** `supabase/functions/generate-anamnese-pdf/index.ts`.

**Novos hooks:** `src/hooks/useAnamneseTemplates.ts`, `src/hooks/useAnamneseResponses.ts`.

**Novos componentes:**
- `src/components/anamnese/TemplateEditor.tsx`
- `src/components/anamnese/QuestionEditor.tsx`
- `src/components/anamnese/AnamneseForm.tsx`
- `src/components/anamnese/SignaturePad.tsx`
- `src/components/anamnese/AnamneseViewer.tsx`
- `src/components/anamnese/ClienteAnamneseTab.tsx`
- `src/components/settings/AnamneseTemplatesSettings.tsx`

**Edições:**
- `src/components/settings/CrmSettings.tsx` n/a — separado.
- `src/pages/Configuracoes.tsx` — novo Accordion.
- `src/pages/ClienteFicha.tsx` — nova aba.
- `src/pages/CRM.tsx` + `src/hooks/useCrm.ts` — card "Sem Anamnese".
- `src/App.tsx` — rota futura `/anamnese/:token` (placeholder).
- `src/types/index.ts` — tipos novos.

### 11. Confirmações antes de codar

1. **Menu:** confirma que NÃO devo mexer no menu inferior (acesso só via ficha + configurações), ou prefere ocupar um slot?
2. **Escopo de hoje:** implemento TUDO acima de uma vez (entrega grande) ou prefere fatiar em fases (Fase 1: schema + modelo + editor; Fase 2: preenchimento + assinatura + PDF; Fase 3: CRM + link)?
3. **PDF:** posso usar `pdf-lib` no edge function (gera PDF programático simples) — ok?
