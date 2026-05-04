import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { getDatabaseClient } from './database';
import { count } from 'drizzle-orm';
import { drizzleSchema } from '@repo/database';

const PORT = Number.parseInt(process.env.PORT ?? '8000')

const databaseClient = getDatabaseClient();
const app = new Hono()
app.get('/', async (c) => {
    const countUsers = await databaseClient.select({ count: count() }).from(drizzleSchema.users);
    return c.json({ count: countUsers[0]?.count });
})

const server = serve({
    fetch: app.fetch,
    port: PORT,
})

console.info(`Server is running on http://localhost:${PORT}`)

// graceful shutdown
process.on('SIGINT', () => {
    server.close()
    process.exit(0)
})

process.on('SIGTERM', () => {
    server.close((err) => {
        if (err) {
            console.error(err)
            process.exit(1)
        }
        process.exit(0)
    })
})