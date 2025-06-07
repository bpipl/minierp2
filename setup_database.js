// Database setup script for Mini-ERP
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Database connection (you'll need to add your anon key)
const supabaseUrl = 'https://qeozkzbjvvkgsvtitbny.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY_HERE'; // Replace with actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Mini-ERP database...');
    
    // Read SQL files
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'supabase/schema.sql'), 'utf8');
    const rlsSQL = fs.readFileSync(path.join(__dirname, 'supabase/rls_policies.sql'), 'utf8');
    const dataSQL = fs.readFileSync(path.join(__dirname, 'supabase/initial_data.sql'), 'utf8');
    
    // Execute schema
    console.log('📊 Creating database schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    if (schemaError) {
      console.error('Schema error:', schemaError);
      return;
    }
    
    // Execute RLS policies
    console.log('🔒 Setting up security policies...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.error('RLS error:', rlsError);
      return;
    }
    
    // Execute initial data
    console.log('📋 Loading initial data...');
    const { error: dataError } = await supabase.rpc('exec_sql', { sql: dataSQL });
    if (dataError) {
      console.error('Data error:', dataError);
      return;
    }
    
    console.log('✅ Database setup complete!');
    console.log('🎯 Next steps:');
    console.log('1. Create your admin user in Supabase dashboard');
    console.log('2. Run: npm run dev');
    console.log('3. Test the login system');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Alternative: Manual setup instructions
function printManualInstructions() {
  console.log(`
🔧 MANUAL SETUP INSTRUCTIONS:

1. Go to: https://supabase.com/dashboard/project/qeozkzbjvvkgsvtitbny/sql

2. Create a new query and run these files in order:
   a) Copy and paste: supabase/schema.sql
   b) Copy and paste: supabase/rls_policies.sql  
   c) Copy and paste: supabase/initial_data.sql

3. Create your admin user:
   a) Go to Authentication > Users
   b) Add your email and password
   c) Go to SQL Editor and run:
      
      -- Get the Director role ID first
      SELECT id FROM roles WHERE name = 'Director/Admin';
      
      -- Then insert your user profile (replace IDs)
      INSERT INTO users (id, email, role_id, first_name, last_name)
      VALUES ('your-auth-user-id', 'your-email@company.com', 'director-role-id', 'Your Name', 'Last Name');

4. Update your .env file with the real anon key

5. Run: npm run dev
  `);
}

// Run the appropriate setup method
if (supabaseKey === 'YOUR_ANON_KEY_HERE') {
  printManualInstructions();
} else {
  setupDatabase();
}

module.exports = { setupDatabase, printManualInstructions };