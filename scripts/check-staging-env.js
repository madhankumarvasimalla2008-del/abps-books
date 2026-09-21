const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Try loading from .env.local, .env, and process.env
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function checkVar(name, isSecret = true) {
  const val = process.env[name];
  if (!val) {
    return { name, status: 'MISSING' };
  }
  if (isSecret) {
    return { name, status: 'PRESENT', length: val.length };
  } else {
    try {
      const parsed = new URL(val);
      return { name, status: 'PRESENT', host: parsed.host };
    } catch {
      return { name, status: 'PRESENT', info: 'configured' };
    }
  }
}

const report = {
  DATABASE_URL: checkVar('DATABASE_URL', true),
  NEXT_PUBLIC_SUPABASE_URL: checkVar('NEXT_PUBLIC_SUPABASE_URL', false),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: checkVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true),
  SUPABASE_SERVICE_ROLE_KEY: checkVar('SUPABASE_SERVICE_ROLE_KEY', true),
};

console.log(JSON.stringify(report, null, 2));
