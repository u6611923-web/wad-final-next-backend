
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing");
}

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["Student", "Teacher"],
  },
}, { timestamps: true });

const User =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);

const accounts = [
  {
    username: "Student One",
    email: "student1@example.com",
    role: "Student",
  },
  {
    username: "Student Two",
    email: "student2@example.com",
    role: "Student",
  },
  {
    username: "Student Three",
    email: "student3@example.com",
    role: "Student",
  },
  {
    username: "Teacher One",
    email: "teacher1@example.com",
    role: "Teacher",
  },
  {
    username: "Teacher Two",
    email: "teacher2@example.com",
    role: "Teacher",
  },
  {
    username: "Teacher Three",
    email: "teacher3@example.com",
    role: "Teacher",
  },
];

try {
  const password = process.env.SEED_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error("Set SEED_PASSWORD (at least 8 characters)");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");

  const hashedPassword = await bcrypt.hash(password, 12);

  for (const account of accounts) {
    const existing = await User.findOne({
      email: account.email,
    });

    if (existing) {
      console.log(`Already exists: ${account.email}`);
      continue;
    }

    await User.create({
      ...account,
      password: hashedPassword,
    });

    console.log(`Created: ${account.email}`);
  }

  console.log("Finished creating test users");
} catch (error) {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
