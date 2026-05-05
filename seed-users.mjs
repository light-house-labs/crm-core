import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define your 4 user accounts here
const usersToCreate = [
  { email: "jeffjoji6@gmail.com", name: "Jeff Joji", role: "admin" },
  { email: "sobinjohnson03@gmail.com", name: "Sobin", role: "admin" },
  { email: "sales@lighthouselabs.in", name: "Lighthouse Labs", role: "admin" },
  { email: "ahsanbashirbusiness@gmail.com", name: "ahsan bashir", role: "admin" },
  { email: "labs.lighthouse@gmail.com", name: "Lighthouse Labs", role: "admin" }
];

const DEFAULT_PASSWORD = "LighthousePassword123!";

async function seedUsers() {
  console.log("Starting user creation...");

  for (const u of usersToCreate) {
    console.log(`\nProcessing ${u.email}...`);
    
    // 1. Add to allowed_users first (so the database trigger doesn't block the user creation)
    const { error: allowError } = await supabase
      .from('allowed_users')
      .upsert({ email: u.email, name: u.name, role: u.role }, { onConflict: 'email' });
      
    if (allowError) {
      console.error(`❌ Failed to whitelist ${u.email}:`, allowError.message);
      continue;
    }
    console.log(`✅ Whitelisted ${u.email}`);

    // 2. Create the user in Supabase Auth
    // 2. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.name }
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // Find user by email and update password
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(uUser => uUser.email === u.email);
        if (user) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            password: DEFAULT_PASSWORD
          });
          if (updateError) console.error(`❌ Failed to reset password for ${u.email}:`, updateError.message);
          else console.log(`✅ Password reset to default for ${u.email}`);
        }
      } else {
        console.error(`❌ Auth error for ${u.email}:`, authError.message);
      }
    } else {
      console.log(`✅ Created Auth login for ${u.email}`);
    }
  }

  console.log(`\n🎉 Done! Users can now log in with the password: ${DEFAULT_PASSWORD}`);
  console.log(`Remember to change these default passwords in the Settings page!`);
}

seedUsers();
