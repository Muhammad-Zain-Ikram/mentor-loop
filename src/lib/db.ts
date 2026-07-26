import mongoose, { type Mongoose } from 'mongoose';

interface MongooseCache {
  connection: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const mongooseCache = (globalThis.mongooseCache ??= {
  connection: null,
  promise: null
});

function getMongoDbUri(): string {
  const mongoDbUri = process.env.MONGODB_URI;

  if (!mongoDbUri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  return mongoDbUri;
}

export async function connectToDatabase(): Promise<Mongoose> {
  if (mongooseCache.connection) {
    return mongooseCache.connection;
  }

  mongooseCache.promise ??= mongoose.connect(getMongoDbUri());

  try {
    mongooseCache.connection = await mongooseCache.promise;
  } catch (error) {
    mongooseCache.promise = null;
    throw error;
  }

  return mongooseCache.connection;
}

export default connectToDatabase;
