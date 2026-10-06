import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  // Since we might not have an exec_sql RPC, let's just instruct the user to run SQL or we can try inserting to trigger an error, but actually we can't alter tables via simple REST API.
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log(`
      ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS username text UNIQUE;
      ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS password text;
      ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'operacional';
  `);
}

main()
