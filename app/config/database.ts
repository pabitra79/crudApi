import dotenv from "dotenv"
import mongoose from "mongoose"

dotenv.config()

export const connectionDb = async () :Promise<void> => {
    try{
        const dbUrl = process.env.MONGODB_URL as string;
    if (!dbUrl) throw new Error("MONGODB_URL not found in .env");

    await mongoose.connect(dbUrl);
    console.log("Database connected successfully");
    }catch(err:any){
console.log("Database connection failed",err.message)
    }
}
