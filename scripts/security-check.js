#!/usr/bin/env node

/**
 * Security Verification Script
 * Checks if Supabase configuration is secure
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Running Security Checks...\n');

let hasErrors = false;
let hasWarnings = false;

// ============================================
// 1. Check Environment Variables
// ============================================
console.log('📋 1. Checking Environment Variables...');

const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('   ❌ .env.local not found!');
    hasErrors = true;
} else {
    const envContent = fs.readFileSync(envPath, 'utf-8');

    // Check for anon key
    const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    if (!anonKeyMatch) {
        console.error('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found!');
        hasErrors = true;
    } else {
        const anonKey = anonKeyMatch[1].trim();
        if (anonKey.length < 100) {
            console.warn('   ⚠️  Anon key seems too short (might be invalid)');
            hasWarnings = true;
        } else {
            console.log('   ✅ Anon key found and looks valid');
        }
    }

    // Check for service role key in NEXT_PUBLIC (DANGEROUS!)
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE')) {
        console.error('   ❌ DANGER! Service role key exposed as NEXT_PUBLIC_*');
        console.error('      This will be visible in browser! Remove immediately!');
        hasErrors = true;
    } else {
        console.log('   ✅ No service role key in NEXT_PUBLIC_* variables');
    }

    // Check URL
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    if (!urlMatch) {
        console.error('   ❌ NEXT_PUBLIC_SUPABASE_URL not found!');
        hasErrors = true;
    } else {
        console.log('   ✅ Supabase URL configured');
    }
}

// ============================================
// 2. Check for Service Role in Client Code
// ============================================
console.log('\n📋 2. Checking for Service Role Key in Client Code...');

const clientDirs = ['components', 'lib'];
let foundServiceRole = false;

function searchInDir(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            if (file.name !== 'node_modules' && file.name !== '.next') {
                searchInDir(fullPath);
            }
        } else if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
            const content = fs.readFileSync(fullPath, 'utf-8');

            // Check for dangerous patterns
            // Exclude server-side files (supabase-admin.ts is safe)
            const isServerFile = fullPath.includes('supabase-admin') ||
                fullPath.includes('/api/');

            if (!isServerFile &&
                content.includes('SUPABASE_SERVICE_ROLE_KEY') &&
                content.includes('process.env.NEXT_PUBLIC')) {
                console.error(`   ❌ Found service role in client code: ${fullPath}`);
                foundServiceRole = true;
                hasErrors = true;
            }
        }
    }
}

clientDirs.forEach(dir => searchInDir(path.join(__dirname, '..', dir)));

if (!foundServiceRole) {
    console.log('   ✅ No service role key found in client code');
    console.log('   ℹ️  Service role usage in API routes is safe (server-side only)');
}

// ============================================
// 3. Check RLS Migration Files
// ============================================
console.log('\n📋 3. Checking RLS Policies...');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
    console.warn('   ⚠️  Migrations directory not found');
    hasWarnings = true;
} else {
    const rlsFile = path.join(migrationsDir, 'optimize_rls_policies.sql');
    if (fs.existsSync(rlsFile)) {
        console.log('   ✅ RLS policies file found');

        const content = fs.readFileSync(rlsFile, 'utf-8');
        const tables = ['profiles', 'events', 'registrations', 'speakers', 'form_fields', 'notifications'];

        tables.forEach(table => {
            if (content.includes(`ON public.${table}`)) {
                console.log(`   ✅ RLS policies defined for: ${table}`);
            } else {
                console.warn(`   ⚠️  No RLS policies found for: ${table}`);
                hasWarnings = true;
            }
        });
    } else {
        console.warn('   ⚠️  RLS optimization file not found');
        hasWarnings = true;
    }
}

// ============================================
// 4. Check for Hardcoded Secrets
// ============================================
console.log('\n📋 4. Checking for Hardcoded Secrets...');

const dangerousPatterns = [
    /password\s*=\s*['"][^'"]+['"]/i,
    /secret\s*=\s*['"][^'"]+['"]/i,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
];

let foundSecrets = false;

function checkForSecrets(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            if (file.name !== 'node_modules' && file.name !== '.next') {
                checkForSecrets(fullPath);
            }
        } else if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
            const content = fs.readFileSync(fullPath, 'utf-8');

            dangerousPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                    // Exclude env variable assignments
                    const lines = content.split('\n');
                    lines.forEach((line, idx) => {
                        if (pattern.test(line) && !line.includes('process.env')) {
                            console.warn(`   ⚠️  Potential hardcoded secret in ${fullPath}:${idx + 1}`);
                            console.warn(`      ${line.trim()}`);
                            foundSecrets = true;
                            hasWarnings = true;
                        }
                    });
                }
            });
        }
    }
}

clientDirs.forEach(dir => checkForSecrets(path.join(__dirname, '..', dir)));

if (!foundSecrets) {
    console.log('   ✅ No hardcoded secrets found');
}

// ============================================
// 5. Summary
// ============================================
console.log('\n' + '='.repeat(50));
console.log('📊 Security Check Summary');
console.log('='.repeat(50));

if (hasErrors) {
    console.error('\n❌ CRITICAL ISSUES FOUND!');
    console.error('   Please fix the errors above before deploying.');
    process.exit(1);
} else if (hasWarnings) {
    console.warn('\n⚠️  WARNINGS FOUND');
    console.warn('   Review the warnings above and fix if necessary.');
    process.exit(0);
} else {
    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('   Your Supabase configuration looks secure.');
    console.log('\n💡 Remember to:');
    console.log('   - Test RLS policies with different users');
    console.log('   - Monitor Supabase logs regularly');
    console.log('   - Enable 2FA on Supabase Dashboard');
    process.exit(0);
}
