import { MongoClient } from 'mongodb';

declare global {
  var __primeprintsMongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment.');
  }
  return uri;
}

function getDbNameFromUri(uri: string): string {
  try {
    const url = new URL(uri);
    const fromPath = url.pathname.replace(/^\//, '');
    if (fromPath) {
      return fromPath;
    }
  } catch {
    // Ignore parse errors and fallback to default.
  }
  return process.env.MONGODB_DB_NAME || 'primeprints';
}

function getClientPromise(): Promise<MongoClient> {
  if (!global.__primeprintsMongoClientPromise) {
    const insecureTls = String(process.env.MONGODB_TLS_INSECURE || '').toLowerCase() === 'true';
    const allowInvalidHostnames = String(process.env.MONGODB_TLS_ALLOW_INVALID_HOSTNAMES || '').toLowerCase() === 'true';
    const client = new MongoClient(getMongoUri(), {
      serverSelectionTimeoutMS: 10000,
      tlsAllowInvalidCertificates: insecureTls,
      tlsAllowInvalidHostnames: allowInvalidHostnames,
    });
    global.__primeprintsMongoClientPromise = client.connect();
  }
  return global.__primeprintsMongoClientPromise;
}

export async function getMongoDb() {
  const uri = getMongoUri();
  const client = await getClientPromise();
  return client.db(getDbNameFromUri(uri));
}

const clientPromise = getClientPromise();

export default clientPromise;
