import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing connection with ANON key...");
  const { data, error } = await supabase.from("leads").select("*").limit(1);
  if (error) {
    console.error("Error details:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Data fetched:", data);
  }
}

testConnection();
