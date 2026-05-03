import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const tables = ['pipeline_stages', 'allowed_users', 'contacts', 'leads', 'projects', 'invoices', 'activities'];
  
  for (const table of tables) {
    console.log(`\nInspecting ${table}...`);
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Columns for ${table}:`, Object.keys(data[0]));
    } else {
      console.log(`Table ${table} is empty.`);
      // Try to get columns by inserting a dummy row and catching the error? No.
      // We can use RPC or just assume the schema.
    }
  }
}

inspect();
