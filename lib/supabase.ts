import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERROR: Faltan las variables de entorno de Supabase en .env.local');
}

// Usamos placeholders si las variables no están para evitar que la app crashee al iniciar.
// Una vez que el usuario cree el archivo .env.local, deberá reiniciar el servidor npm run dev.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
