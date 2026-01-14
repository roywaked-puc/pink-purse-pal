import { PostgrestError } from '@supabase/supabase-js';

/**
 * Maps PostgreSQL error codes to user-friendly messages
 * This prevents leaking database schema details to the client
 */
const errorMessages: Record<string, string> = {
  // Unique constraint violations
  '23505': 'Este registro já existe',
  // Foreign key violations
  '23503': 'Não é possível completar a operação: existem dados relacionados',
  // Not null violations
  '23502': 'Campo obrigatório não preenchido',
  // Check constraint violations
  '23514': 'Os dados informados são inválidos',
  // Row level security violations
  '42501': 'Você não tem permissão para realizar esta operação',
  // PostgREST errors
  'PGRST': 'Erro ao processar a solicitação',
  // Default
  'unknown': 'Ocorreu um erro ao processar a operação',
};

/**
 * Sanitizes database errors to prevent schema information leakage
 * Logs the original error for debugging while returning a user-friendly message
 */
export function sanitizeDbError(error: PostgrestError | Error | unknown): Error {
  // Log original error for debugging (in production, this would go to a logging service)
  console.error('[DB Error]:', error);
  
  if (!error || typeof error !== 'object') {
    return new Error(errorMessages['unknown']);
  }
  
  // Handle PostgrestError
  if ('code' in error && typeof (error as PostgrestError).code === 'string') {
    const pgError = error as PostgrestError;
    const code = pgError.code;
    
    // Check for RLS policy violations (these often have specific message patterns)
    if (pgError.message?.includes('row-level security')) {
      return new Error(errorMessages['42501']);
    }
    
    // Check for PGRST prefixed errors
    if (code?.startsWith('PGRST')) {
      return new Error(errorMessages['PGRST']);
    }
    
    // Map known error codes
    const message = errorMessages[code] || errorMessages['unknown'];
    return new Error(message);
  }
  
  // Handle generic errors - don't expose raw messages
  if (error instanceof Error) {
    // Only pass through known safe messages
    const safePatterns = [
      'Not authenticated',
      'Usuário não autenticado',
    ];
    
    if (safePatterns.some(pattern => error.message.includes(pattern))) {
      return error;
    }
    
    return new Error(errorMessages['unknown']);
  }
  
  return new Error(errorMessages['unknown']);
}
