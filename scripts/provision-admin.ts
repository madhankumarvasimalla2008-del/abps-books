/**
 * ============================================================================
 * ABPS Book Distribution Platform — Staging Admin Provisioning Script
 * ============================================================================
 * PURPOSE: Secure server-side provisioning for the central staging administrator.
 *
 * SAFETY INVARIANTS:
 * - Supabase Auth is the ONLY authority for credentials and password setup.
 * - Zero passwords or password hashes are accepted, handled, or stored in PostgreSQL.
 * - Strict 1:1 mapping between Supabase user.id UUID and auth_users.id.
 * - Assigns strictly the 'admin' role in user_roles.
 * - Idempotent: safe to run multiple times without duplicating records.
 * - Service-role key remains strictly server-side and is NEVER printed or logged.
 * - Loads .env.local BEFORE importing database client.
 * ============================================================================
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 1. Load environment variables BEFORE importing database/auth modules
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

// 2. Validate required environment variables
const missingVars: string[] = [];
if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variable(s):');
  for (const v of missingVars) {
    console.error(`   - ${v}`);
  }
  console.error('\nPlease configure these variables in .env.local or execution environment.');
  process.exit(1);
}

// 3. Parse CLI arguments and environment variables
function parseArgs(): { email?: string; name?: string; phone?: string; sendInvite: boolean } {
  const args = process.argv.slice(2);
  let email = process.env.ADMIN_EMAIL;
  let name = process.env.ADMIN_NAME;
  let phone = process.env.ADMIN_PHONE;
  let sendInvite = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--email=')) {
      email = arg.split('=')[1];
    } else if (arg === '-e' || arg === '--email') {
      email = args[++i];
    } else if (arg.startsWith('--name=')) {
      name = arg.split('=')[1];
    } else if (arg === '-n' || arg === '--name') {
      name = args[++i];
    } else if (arg.startsWith('--phone=')) {
      phone = arg.split('=')[1];
    } else if (arg === '-p' || arg === '--phone') {
      phone = args[++i];
    } else if (arg === '--no-invite') {
      sendInvite = false;
    }
  }

  return { email, name, phone, sendInvite };
}

function printUsage() {
  console.log(`
================================================================================
ABPS Textbook Platform — Staging Administrator Provisioning Tool
================================================================================

USAGE:
  npm run admin:provision -- --email=<email> --name="<full_name>" [options]

OPTIONS:
  --email, -e       Admin user email address (required)
  --name, -n        Admin user full name (required, min 2 chars)
  --phone, -p       Admin contact phone (optional)
  --no-invite       Create user without sending Supabase invite email (optional)

ENVIRONMENT VARIABLE ALTERNATIVES:
  ADMIN_EMAIL="admin@abps.edu" ADMIN_NAME="Central Admin" npm run admin:provision

EXAMPLES:
  npm run admin:provision -- --email=admin@abps.edu --name="Central Admin"
  npm run admin:provision -- -e principal@abps.edu -n "Principal Sharma"
================================================================================
`);
}

async function runProvisioning() {
  const { email, name, phone, sendInvite } = parseArgs();

  if (!email || !name) {
    console.error('❌ Error: Both --email and --name are required.\n');
    printUsage();
    process.exit(1);
  }

  // 4. Dynamically import database and provisioning service AFTER dotenv is loaded
  const { client } = await import('../src/db');
  const { provisionAdminUser } = await import('../src/server/auth/provisioning');

  console.log('🔒 Initializing administrator provisioning...');
  console.log(`   Target Email: ${email}`);
  console.log(`   Full Name:    ${name}`);
  console.log(`   Invite Mode:  ${sendInvite ? 'Email Invitation (Supabase Auth)' : 'Direct Admin Creation'}`);

  try {
    const result = await provisionAdminUser({
      email,
      fullName: name,
      phone,
      sendInvite,
    });

    console.log('\n============================================================');
    console.log('✅ ADMINISTRATOR PROVISIONING SUCCESSFUL');
    console.log('============================================================');
    console.log(`Status:           ${result.isNewUser ? 'New User Created' : 'Existing User Updated'}`);
    console.log(`User ID (UUID):   ${result.userId}`);
    console.log(`Email:            ${result.email}`);
    console.log(`Full Name:        ${result.fullName}`);
    console.log(`Assigned Role:    ${result.role}`);
    console.log(`Invitation:       ${result.invitationSent ? 'Sent via Supabase Auth email' : 'Direct confirmation'}`);
    console.log(`Database Sync:    Synchronized (auth_users, user_roles, staff_profiles)`);
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ Provisioning failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runProvisioning();
