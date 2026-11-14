# Plano: Minha Marca + Boas-vindas de primeiro acesso

Sem migrações — o banco já está pronto. Se faltar algo no banco, paro e pergunto.

## 1. Fundação (hooks e utilitários)

- **`src/lib/marca.ts`** (novo): conversão hex → HSL, cálculo de contraste (texto branco ou escuro sobre a cor), as 8 cores prontas + padrão rosa, chave de localStorage.
- **`src/lib/aplicarTema.ts`** (novo): aplica em tempo de execução os tokens `--primary`, `--primary-foreground`, `--ring` e os tons derivados existentes em `src/index.css` (secondary, accent, sidebar-*), convertendo o hex para HSL. Não altera `index.css` em si, nem cores de serviços, status, timeline ou retenção.
- **`src/hooks/useUserSettings.ts`**: incluir `nome_negocio`, `logo_path`, `cor_primaria`, `onboarding_concluido_em` na lista de colunas seguras, no tipo `UserSettings` e nos defaults. Nenhuma mudança de padrão.
- **`src/hooks/useMarca.ts`** (novo): lê os campos de marca via `useUserSettings`, expõe `useUpdateMarca` (nome, cor, logo) e `useUploadLogo` / `useRemoverLogo` (storage bucket `logos`, upsert em `{userId}/logo.<ext>`, apaga a extensão antiga se mudou, grava `logo_path`). URL pública com `?v=<updated_at>` contra cache.
- **Anti-"piscar"**: script inline pequeno no `index.html` lê a cor do localStorage e aplica os tokens antes do primeiro render; logout limpa a chave (em `AuthContext.signOut`).

## 2. Componente de marca reutilizável

- **`src/components/settings/MarcaForm.tsx`** (novo): nome do negócio, logo e cor, com prévia ao vivo (mini-cartão mostrando logo + nome + botão na cor escolhida).
  - Logo: aceita só PNG/JPG/WebP até 2 MB, com mensagem clara para outro formato; recorte quadrado antes de enviar (canvas, sem dependência nova); botão "Remover logo".
  - Cor: 8 opções prontas (Rosa #EC4899 padrão, Vinho #9D174D, Lilás #A855F7, Azul #3B82F6, Verde-água #14B8A6, Terracota #C2410C, Dourado #B8860B, Grafite #374151) + "Personalizada" com seletor de cor; botão "Voltar ao rosa padrão" grava NULL.
- **`src/components/settings/MinhaMarcaSettings.tsx`** (novo): item "Minha Marca" como **primeiro** da lista em `Configuracoes.tsx`, abrindo em FormSheet/Drawer (padrão dos demais itens), usando o `MarcaForm`.

## 3. Onde a marca aparece

- **Cabeçalho do app** (`MainLayout`): faixa discreta no topo com logo + nome do negócio; se não houver marca, renderiza exatamente como hoje.
- **Ficha de anamnese** (visualização, impressão e PDF): logo + nome no topo.
- **PDFs de relatórios** (`RelatorioFinanceiro`, `RelatorioMovimentacoes`, `RelatorioAgendamentos`): nome do negócio e logo no cabeçalho.

## 4. Boas-vindas (primeiro acesso)

- **`src/components/onboarding/BoasVindasSheet.tsx`** (novo): bottom sheet em 3 passos, cada um com "Pular". Aparece quando `onboarding_concluido_em` for NULL ou não houver linha em `user_settings`. Ao concluir ou pular tudo, grava `onboarding_concluido_em = agora` (upsert via `useUpdateUserSettings`).
  - **Passo 1 "Sua marca"**: reutiliza o `MarcaForm`.
  - **Passo 2 "Seus preços"**: lista os serviços já criados pelo modelo inicial, agrupando cada serviço com suas faixas de manutenção, valor editável na própria linha (usa `useUpdateService` existente). Texto: "Já deixamos um catálogo pronto. Ajuste os valores para os seus."
  - **Passo 3 "Tudo pronto"**: cartão opcional "Separar automaticamente R$ X de cada atendimento para as contas do negócio?" com chave desligada por padrão (`caixa_reserva_ativo` + `caixa_reserva_valor`, valor editável) e botão principal "Criar meu primeiro agendamento" (leva à Agenda).
- Montado no `App.tsx` (ou `MainLayout`) para aparecer sobre qualquer tela no primeiro acesso.

## 5. Regras respeitadas

- Mobile-first, textos em português, padrão de hooks via AppContext, sem acesso direto ao banco nas páginas, sem editar `types.ts`, sem cor hardcoded em componentes (tema só via tokens), sem mudar comportamento fora do descrito.

## Verificação

- Typecheck + build + lint nos arquivos tocados.
- Teste no navegador em 360px: definir nome/logo/cor na Minha Marca, ver tema aplicado sem piscar após recarregar, conferir cabeçalho e um PDF.
- Simular primeiro acesso (limpar `onboarding_concluido_em` em conta de teste) e percorrer os 3 passos.
