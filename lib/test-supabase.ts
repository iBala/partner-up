const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment Check:');
console.log('📌 Supabase URL present:', !!supabaseUrl);
console.log('📌 Anon Key present:', !!anonKey);
console.log('📌 Service Key present:', !!serviceKey);

// Safely show key prefixes (first 6 chars) for debugging
if (anonKey) console.log('📌 Anon Key starts with:', anonKey.substring(0, 6) + '...');
if (serviceKey) console.log('📌 Service Key starts with:', serviceKey.substring(0, 6) + '...');

async function testWithKey(key: string, keyType: string) {
  console.log(`\n🔍 Testing with ${keyType}...`);
  const supabase = createClient(supabaseUrl!, key);

  try {
    // Test 1: Basic connection test with auth
    console.log('📝 Testing Auth Connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error(`❌ Auth Error with ${keyType}:`, sessionError.message);
      return;
    }
    
    console.log(`✅ Auth connection successful with ${keyType}`);
    
    // Test 2: Try to fetch from partner_jobs table
    console.log(`📝 Testing Database Connection with ${keyType}...`);
    const { data: jobs, error: jobsError } = await supabase
      .from('partner_jobs')
      .select('*')
      .limit(1);
    
    if (jobsError) {
      console.error(`❌ Database Error with ${keyType}:`, jobsError.message);
      console.error('Error Details:', jobsError);
      return;
    }
    
    console.log(`✅ Database query successful with ${keyType}`);
    console.log('📊 Sample data:', jobs);
    
  } catch (error) {
    console.error(`❌ Unexpected error with ${keyType}:`, error);
  }
}

// Run tests with both keys
async function runTests() {
  if (anonKey) {
    await testWithKey(anonKey, 'Anon Key');
  }
  
  if (serviceKey) {
    await testWithKey(serviceKey, 'Service Role Key');
  }
}

runTests(); 