import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Ces valeurs doivent être définies de façon synchrone, avant que le premier
// fichier de test n'importe src/app.ts (et donc src/config/env.ts, qui valide
// process.env dès son chargement). MONGO_URI est un placeholder : la vraie
// connexion se fait ci-dessous vers l'instance MongoMemoryServer, une fois
// celle-ci démarrée de façon asynchrone dans beforeAll.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-not-for-production";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key-not-for-production";
process.env.TIMBRE_FISCAL_MONTANT = "1";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/stockflow-test-placeholder";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
