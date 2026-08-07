import mongoose from "mongoose";
import { env } from "./env";

mongoose.set("strictQuery", true);

export async function connectDB(): Promise<void> {
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connecté");
  });
  mongoose.connection.on("error", (err) => {
    console.error("❌ Erreur de connexion MongoDB :", err);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB déconnecté");
  });

  await mongoose.connect(env.MONGO_URI);
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
