import { MongoClient } from 'mongodb'

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI!
if (!uri) throw new Error('MONGODB_URI is missing')

const client = new MongoClient(uri)
const clientPromise = global._mongoClientPromise ?? client.connect()

if (process.env.NODE_ENV !== 'production') {
    global._mongoClientPromise = clientPromise
}

export async function db() {
    const c = await clientPromise
    return c.db()
}
