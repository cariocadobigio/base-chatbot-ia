import { createClient } from '@supabase/supabase-js';

// Pegamos as chaves das variáveis de ambiente com segurança
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validação Fail-fast
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Atenção: Variáveis de ambiente do Supabase não encontradas.');
}

// Exportamos a instância do banco para usar em qualquer lugar do projeto
export const supabase = createClient(supabaseUrl, supabaseAnonKey);