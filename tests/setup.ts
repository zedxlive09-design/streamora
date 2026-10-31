// Vitest setup — runs before each test file.
// Loads .env so DATABASE_URL is set for tests that touch Prisma.

import { config } from 'dotenv'
config({ path: '.env' })

// Use a separate test database to avoid clobbering dev data.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'file:./db/test.db'
