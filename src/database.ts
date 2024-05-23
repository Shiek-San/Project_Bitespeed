import "reflect-metadata";
import { createConnection } from "typeorm";
import { Contact } from "./entity/Contact";
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    await createConnection({
      type: "mysql",
      host: process.env.DB_HOST,
      port: parseInt(String(process.env.DB_PORT), 10),
      username: process.env.DB_USER_NAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Contact],
      synchronize: true,
    });
    console.log("Database connection established");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};

export default connectDB;
