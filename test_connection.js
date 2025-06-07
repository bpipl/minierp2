#!/usr/bin/env node

// Test Supabase connection for Mini-ERP
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Testing Supabase Connection...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data, error } = await supabase.from('pg_stat_user_tables').select('count');
    
    if (error) {
      console.log('🔍 Database might be empty (expected for new setup)');
      console.log('Error:', error.message);
    } else {
      console.log('✅ Connection successful!');
    }

    // Test if our tables exist
    console.log('\n2️⃣ Checking for Mini-ERP tables...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['roles', 'users', 'order_lines', 'customers']);

    if (tableError) {
      console.log('⚠️  Tables not found - need to run database setup');
      console.log('Next step: Run the SQL scripts in Supabase dashboard');
      return false;
    }

    if (tables && tables.length > 0) {
      console.log('✅ Found Mini-ERP tables:', tables.map(t => t.table_name).join(', '));
      
      // Test roles data
      console.log('\n3️⃣ Checking roles...');
      const { data: roles, error: roleError } = await supabase
        .from('roles')
        .select('name')
        .limit(3);

      if (roleError) {
        console.log('⚠️  Could not read roles:', roleError.message);
      } else {
        console.log('✅ Available roles:', roles.map(r => r.name).join(', '));
      }

      return true;
    } else {
      console.log('⚠️  Mini-ERP tables not found');
      return false;
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function main() {
  const isSetup = await testConnection();
  
  console.log('\n📋 Status Summary:');
  if (isSetup) {
    console.log('✅ Database is ready!');
    console.log('🚀 Next: Create your admin user and test login');
  } else {
    console.log('⚠️  Database needs setup');
    console.log('📝 Next steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/qeozkzbjvvkgsvtitbny/sql');
    console.log('2. Run the SQL scripts from supabase/ folder');
    console.log('3. Create your admin user');
    console.log('4. Test again');
  }
}

main().catch(console.error);