export function whatsappLink(phone: string | undefined, message: string): string | null {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean) return null;
  const withCountry = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export const waMessages = {
  confirm: (name: string, dateStr: string) =>
    `Olá ${name}! Tudo bem? Passando para confirmar seu agendamento em ${dateStr}. Posso confirmar? ✨`,
  return: (name: string) =>
    `Olá ${name}! Já está chegando a hora do seu retorno. Quer agendar um horário? ✨`,
  inactive: (name: string) =>
    `Oi ${name}! Faz um tempinho que não nos vemos 💕 Que tal marcar um horário? Posso te encaixar.`,
  pendingPayment: (name: string, value: string) =>
    `Olá ${name}! Tudo bem? Apenas um lembrete carinhoso sobre o saldo de ${value}. Qualquer dúvida estou à disposição 💕`,
  birthday: (name: string) =>
    `Parabéns, ${name}! 🎉🎂 Que seu dia seja tão lindo quanto você. Um presente especial te aguarda — vamos marcar? 💕`,
};
