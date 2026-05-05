import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from("projects").select("*, contacts(first_name, last_name, company), assigned_to:allowed_users(name, email), leads!projects_lead_id_fkey(source)").limit(1);
console.log(error);
console.log(data);
