const { execSync } = require('child_process');
const net = require('net');
const path = require('path');

// Custom helper to load environment variables from .env and .env.local files without external dependencies
const fs = require('fs');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        // Remove surrounding double or single quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.warn(`⚠️ Failed to parse env file at ${filePath}:`, err.message);
  }
}

const projectDir = path.resolve(__dirname, '..');
loadEnvFile(path.join(projectDir, '.env'));
loadEnvFile(path.join(projectDir, '.env.local'));
console.log('✅ Environment variables loaded.');

// Ensure DIRECT_URL is defined (defaults to DATABASE_URL) to satisfy Prisma validation during migration/build
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.log('ℹ️  DIRECT_URL was not set. Defaulted DIRECT_URL to DATABASE_URL.');
}

const DATABASE_URL = process.env.DATABASE_URL;

function obfuscateUrl(urlStr) {
  if (!urlStr) return 'Not set';
  try {
    const url = new URL(urlStr);
    if (url.password) url.password = '******';
    return url.toString();
  } catch {
    // If not a valid URL (e.g. SQLite path), obfuscate credentials if any
    return urlStr.replace(/:([^:@]+)@/, ':******@');
  }
}

console.log(`📡 Database URL: ${obfuscateUrl(DATABASE_URL)}`);

// Check if we should skip database setup
if (process.env.SKIP_DB_SETUP === 'true') {
  console.log('⏩ SKIP_DB_SETUP is set to true. Skipping database setup.');
  process.exit(0);
}

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not defined.');
  if (process.env.VERCEL === '1' || process.env.NETLIFY === '1' || process.env.CI === 'true') {
    console.log('⚠️  Detected CI/Serverless build environment. Exiting gracefully to prevent build failure.');
    process.exit(0);
  }
  process.exit(1);
}

// Function to check if database port is reachable (TCP ping)
function checkConnection(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.destroy();
      if (!resolved) {
        resolved = true;
        resolve(true);
      }
    });

    const onError = () => {
      socket.destroy();
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    };

    socket.on('error', onError);
    socket.on('timeout', onError);

    socket.connect(port, host);
  });
}

// Wait for database server to become reachable
async function waitForDatabase(host, port, maxRetries = 15, delayMs = 2000) {
  console.log(`⏳ Waiting for database server at ${host}:${port} to be reachable...`);
  for (let i = 1; i <= maxRetries; i++) {
    const isReachable = await checkConnection(host, port);
    if (isReachable) {
      console.log(`✅ Database server at ${host}:${port} is reachable!`);
      return true;
    }
    console.log(`   [Attempt ${i}/${maxRetries}] Database server not ready yet. Retrying in ${delayMs / 1000}s...`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

// Ensure the database exists before running migrations
async function ensureDatabaseExists(prismaCliPath) {
  if (!DATABASE_URL) return;

  const isPostgres = DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://');
  const isMysql = DATABASE_URL.startsWith('mysql://');

  if (!isPostgres && !isMysql) {
    console.log('ℹ️ Non-Postgres/MySQL connection string. Skipping database auto-creation check.');
    return;
  }

  try {
    const url = new URL(DATABASE_URL);
    const dbName = url.pathname.substring(1);
    if (!dbName) {
      console.log('ℹ️ No database name found in connection string. Skipping database auto-creation check.');
      return;
    }

    console.log(`🔍 Checking if database "${dbName}" exists...`);

    // Import PrismaClient dynamically (assumed to be generated already)
    const { PrismaClient } = require('@prisma/client');

    // Create a connection URL pointing to the default database (postgres/mysql) to perform the check/creation
    const defaultUrl = new URL(DATABASE_URL);
    defaultUrl.pathname = isPostgres ? '/postgres' : '/mysql';
    const defaultDbUrl = defaultUrl.toString();

    const tempClient = new PrismaClient({
      datasources: {
        db: {
          url: defaultDbUrl,
        },
      },
    });

    try {
      if (isPostgres) {
        // Query pg_database to check if the target database exists
        const result = await tempClient.$queryRawUnsafe(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          dbName
        );

        if (result.length === 0) {
          console.log(`➕ Database "${dbName}" does not exist. Attempting to create...`);
          // Escape database name by doubling double-quotes
          const escapedDbName = dbName.replace(/"/g, '""');
          await tempClient.$executeRawUnsafe(`CREATE DATABASE "${escapedDbName}"`);
          console.log(`✅ Database "${dbName}" created successfully!`);
        } else {
          console.log(`✅ Database "${dbName}" already exists.`);
        }
      } else if (isMysql) {
        // MySQL supports IF NOT EXISTS natively
        const escapedDbName = dbName.replace(/`/g, '``');
        await tempClient.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS \`${escapedDbName}\``);
        console.log(`✅ Database "${dbName}" ensured (created if not exists).`);
      }
    } finally {
      await tempClient.$disconnect();
    }
  } catch (err) {
    console.warn(`⚠️ Warning: Could not check or create database. It may already exist or user lacks permission:`, err.message);
  }
}

async function run() {
  let host = null;
  let port = null;

  try {
    // Try parsing hostname and port from connection string
    if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('mysql://')) {
      const urlObj = new URL(DATABASE_URL);
      host = urlObj.hostname;
      port = parseInt(urlObj.port || (DATABASE_URL.startsWith('mysql://') ? '3306' : '5432'), 10);
    }
  } catch (err) {
    console.log('ℹ️  Could not parse connection string for TCP ping (e.g. SQLite or connection pool URL). Skipping TCP check.');
  }

  // If we extracted a host and port, wait for it to be ready
  if (host && port) {
    const ready = await waitForDatabase(host, port);
    if (!ready) {
      console.error(`❌ Timeout: Database server at ${host}:${port} could not be reached after repeated attempts.`);
      if (process.env.VERCEL === '1' || process.env.NETLIFY === '1' || process.env.CI === 'true') {
        console.warn('⚠️  CI/Serverless environment detected. Proceeding anyway, hoping database is reachable at runtime.');
      } else {
        process.exit(1);
      }
    }
  }

  // Execute database setup operations
  try {
    // Resolve local Prisma CLI path to bypass npx resolution issues entirely
    let prismaCliPath;
    try {
      const prismaDir = path.dirname(require.resolve('prisma/package.json', { paths: [projectDir] }));
      prismaCliPath = path.join(prismaDir, 'build', 'index.js');
      if (!fs.existsSync(prismaCliPath)) {
        prismaCliPath = path.join(prismaDir, 'bin', 'index.js');
      }
      console.log(`🎯 Located local Prisma CLI: ${prismaCliPath}`);
    } catch (err) {
      console.error('❌ Error: Prisma is not installed locally in node_modules. Please run "npm install".');
      process.exit(1);
    }

    // 1. Generate Prisma Client first to ensure it's generated and up to date before we load it
    console.log('📦 Generating Prisma Client...');
    execSync(`node "${prismaCliPath}" generate`, { cwd: projectDir, stdio: 'inherit' });

    // 2. Ensure the database itself exists
    await ensureDatabaseExists(prismaCliPath);

    // 3. Run Migrations (or db push depending on settings)
    if (process.env.DB_PUSH === 'true') {
      console.log('🚀 Applying schema changes via prisma db push...');
      execSync(`node "${prismaCliPath}" db push --accept-data-loss`, { cwd: projectDir, stdio: 'inherit' });
    } else {
      console.log('🚀 Running database migrations via prisma migrate deploy...');
      execSync(`node "${prismaCliPath}" migrate deploy`, { cwd: projectDir, stdio: 'inherit' });
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (err) {
    console.error('❌ Error executing database migrations/setup:', err.message);
    if (process.env.VERCEL === '1' || process.env.NETLIFY === '1' || process.env.CI === 'true') {
      console.warn('⚠️  CI/Serverless environment detected. Ignoring failure to allow build completion.');
      process.exit(0);
    }
    process.exit(1);
  }
}

run();

