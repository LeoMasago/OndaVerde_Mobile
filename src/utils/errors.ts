/** Traduz erros do banco de dados em mensagens simples para o cidadão. */
export function describeDbError(error: Error | null): string {
  const text = `${error?.message ?? ''}`.toLowerCase();
  if (text.includes('permission') || text.includes('insufficient')) {
    return 'O banco de dados recusou o acesso. Confira as regras do Firestore (veja o README).';
  }
  return 'Não foi possível carregar as ocorrências. Verifique sua conexão e tente de novo.';
}

/** Mensagem curta para falhas ao gravar. */
export function describeWriteError(error: unknown): string {
  const text = `${error instanceof Error ? error.message : ''}`.toLowerCase();
  if (text.includes('permission') || text.includes('insufficient')) {
    return 'O banco recusou o envio. Confira as regras do Firestore (veja o README).';
  }
  if (text.includes('tempo esgotado')) {
    return 'Tempo esgotado. Verifique sua internet e tente de novo.';
  }
  return 'Não foi possível concluir. Tente de novo em instantes.';
}
