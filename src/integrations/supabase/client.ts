// Gerado originalmente pelo Lovable. Editado à mão a 09/09/2026 para acrescentar a
// verificação das variáveis de ambiente — ver o comentário abaixo.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// O Vite substitui import.meta.env em tempo de compilação. Se as variáveis não
// existirem no ambiente do build, o que fica no bundle é `undefined` — e o
// createClient aceita-o sem se queixar. O resultado é um site que compila,
// publica e só parte no browser, com um erro que não diz qual é o problema.
//
// Isto pára aqui, com o nome da variável que falta. Não substitui a verificação
// no build: para o build falhar, a verificação teria de estar no vite.config.ts.
const emFalta = [
  !SUPABASE_URL && 'VITE_SUPABASE_URL',
  !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
].filter(Boolean);

if (emFalta.length > 0) {
  throw new Error(
    `Configuração do Supabase em falta: ${emFalta.join(', ')}.\n` +
      'Estas variáveis são lidas em tempo de compilação. Localmente vêm do ficheiro .env ' +
      '(que não está versionado); no Cloudflare Pages têm de estar definidas nas variáveis ' +
      'de ambiente do projecto, para o ambiente de produção E o de preview.\n' +
      'A instância oficial é ijpxjpbjudaddfatibfl.',
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
