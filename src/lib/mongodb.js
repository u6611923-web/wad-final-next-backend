import mongoose from "mongoose";

const URI = process.env.MONGODB_URI;

if (!URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

export async function connectDB(){
  if(mongoose.connection.ReadyState === 1){

   return;
  }

  await mongoose.connect(URI);
}