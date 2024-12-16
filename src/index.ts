import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {z} from "zod";
import { Router } from "express";
import { usermodel1 } from "./Db";
import bcrypt from "bcrypt";
import userrouter from "./routes/brainRoutes";
dotenv.config(); 

const app = express();
app.use(express.json());

app.use("/api/v1", userrouter);



// const MONGO_URI = "mongodb+srv://padhirajesh88:r2fCl3o67qtNi50Q@cluster0.xbav6.mongodb.net/brainly?retryWrites=true&w=majority";
async function run() {
  try {
    const mongoUri = process.env.MONGO_URI?.toString(); // Access the environment variable
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined. Check your .env file.");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to the database");

    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

run();
