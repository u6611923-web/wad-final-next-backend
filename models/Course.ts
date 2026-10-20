
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  name: string;
  duration: number;
  topics: string[];
  price: number;
  maxStudent: number;
  status: "Open" | "Close" | "Cancel";
  teacher: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    topics: [{
      type: String,
      trim: true,
    }],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    maxStudent: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Open", "Close", "Cancel"],
      default: "Open",
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Course: Model<ICourse> =
  (mongoose.models.Course as Model<ICourse>) ||
  mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
