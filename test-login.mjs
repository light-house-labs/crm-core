import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.auth.signInWithPassword({ email: "labs.lighthouse@gmail.com", password: "LighthousePassword123!" });
console.log("Error:", error?.message);
console.log("User:", data?.user?.email);
