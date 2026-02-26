#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs SQL migrations in order
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not found in .env')
  process.exit(1)
}

async function runMigrations() {
  const client = new Client({ connectionString })

  try {
    console.log('🔗 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!\n')

    const migrationDir = path.join(__dirname, 'database', 'migrations')
    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort()

    for (const file of files) {
      const filePath = path.join(migrationDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')

      console.log(`📝 Running: ${file}`)
      try {
        await client.query(sql)
        console.log(`✅ ${file} completed\n`)
      } catch (err) {
        console.error(`❌ Error in ${file}:`)
        console.error(err.message)
        throw err
      }
    }

    console.log('✨ All migrations completed successfully!')

    // Verify tables
    const result = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )
    console.log('\n📊 Created tables:')
    result.rows.forEach(row => console.log(`  - ${row.tablename}`))

  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()
