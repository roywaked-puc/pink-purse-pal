import { Account, Transaction } from '@/types';

/**
 * Um lançamento pertence à conta quando aponta para o id dela
 * (campo novo `accountId`, ou o campo legado `account` guardando id ou nome).
 */
export function belongsToAccount(transaction: Transaction, account: Account): boolean {
  return (
    transaction.accountId === account.id ||
    transaction.account === account.id ||
    transaction.account === account.name
  );
}

/** Contas de permuta não são dinheiro real — ficam fora do saldo geral. */
export function isPermutaTransaction(transaction: Transaction, accounts: Account[]): boolean {
  return accounts.some((a) => a.type === 'permuta' && belongsToAccount(transaction, a));
}
