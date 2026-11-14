export async function concluirOnboarding(
  salvar: (dados: { onboarding_concluido_em: string }) => Promise<{ onboarding_concluido_em: string | null }>,
  aoConcluir: () => void,
  agora = new Date(),
) {
  const dados = await salvar({ onboarding_concluido_em: agora.toISOString() });
  if (!dados.onboarding_concluido_em) {
    throw new Error('A conclusão não foi gravada. Tente novamente.');
  }
  aoConcluir();
  return dados.onboarding_concluido_em;
}