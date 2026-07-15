const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env file manually in the project root
const envPath = path.join(__dirname, '.env');
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  });
} catch (e) {
  console.error('Failed to read .env file:', e);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env');
  process.exit(1);
}

console.log('Connecting to Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const testMsgId = 'test_' + Math.random().toString(36).substr(2, 9);
  console.log('Inserting test message with ID:', testMsgId);
  
  // 1. Insert test message (mocking Prabal sending a message in a DM to Kabir)
  const { data: insertData, error: insertError } = await supabase
    .from('messages')
    .insert([
      {
        id: testMsgId,
        sender_id: '1', // Prabal
        sender_name: 'Prabal Luthra',
        sender_role: 'superadmin',
        text: 'Automated Supabase real-time connection test',
        channel: 'dm_1_2'
      }
    ]);

  if (insertError) {
    console.error('❌ Insert failed! Database constraints error:', insertError.message);
    console.error('Details:', insertError.details || insertError.hint);
    process.exit(1);
  }
  
  console.log('✅ Message inserted successfully!');

  // 2. Read it back
  const { data: selectData, error: selectError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', testMsgId)
    .single();

  if (selectError) {
    console.error('❌ Select failed:', selectError.message);
    process.exit(1);
  }

  console.log('✅ Message verified in database:');
  console.log(selectData);

  // 3. Clean it up
  console.log('Cleaning up test message...');
  await supabase.from('messages').delete().eq('id', testMsgId);
  console.log('✅ Cleanup completed! Test passed 100%!');
}

runTest();
