#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies recommended database improvements from brownfield discovery
 * Author: @dev (Dex)
 * Date: 2026-02-20
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database connection string from environment
// Supabase connection string format:
// postgres://postgres:password@host:port/database
const connectionString = process.env.DATABASE_URL || (() => {
  throw new Error('DATABASE_URL environment variable not set. Please provide Supabase connection string.');
})();

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260220_recommended_indexes_and_constraints.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into statements (split by semicolon, but be careful with comments)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))
      .filter(s => s.length > 10); // Filter out empty statements

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let executedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();

      // Extract a simple description from the statement
      let description = statement.substring(0, 50);
      if (statement.toLowerCase().startsWith('create index')) {
        description = statement.match(/CREATE INDEX[^ON]*ON\s+(\S+)/i)?.[1] || 'Unknown Index';
      } else if (statement.toLowerCase().startsWith('alter table')) {
        description = statement.match(/ALTER TABLE\s+(\S+)/i)?.[1] || 'Table Alteration';
      } else if (statement.toLowerCase().startsWith('create or replace function')) {
        description = statement.match(/FUNCTION\s+(\S+)/i)?.[1] || 'Function';
      } else if (statement.toLowerCase().startsWith('create or replace view')) {
        description = statement.match(/VIEW\s+(\S+)/i)?.[1] || 'View';
      }

      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${description}...`);
        await client.query(statement);
        console.log(`✅ Success\n`);
        executedCount++;
      } catch (error) {
        // Check if error is because object already exists (which is OK with IF NOT EXISTS)
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Already exists (skipping)\n`);
          executedCount++;
        } else {
          console.error(`❌ Error: ${error.message}\n`);
          errorCount++;
          errors.push({
            statement: description,
            error: error.message
          });
        }
      }
    }

    // Verify indexes were created
    console.log('\n📊 Verifying indexes...\n');
    const indexQuery = `
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      ORDER BY indexname;
    `;

    const indexResult = await client.query(indexQuery);
    console.log(`✅ Found ${indexResult.rows.length} indexes:\n`);
    indexResult.rows.forEach(index => {
      console.log(`  • ${index.indexname} on ${index.tablename}`);
    });

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 Migration Summary`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total statements: ${statements.length}`);
    console.log(`Successfully executed: ${executedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  Errors encountered:\n`);
      errors.forEach(err => {
        console.log(`  • ${err.statement}: ${err.error}`);
      });
      process.exit(1);
    } else {
      console.log(`\n✅ Migration completed successfully!`);
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

main();
