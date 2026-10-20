
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../lib/mongodb";
import {
  verifyToken,
  getTokenFromHeader,
} from "../../../lib/auth";
import Course from "../../../../models/Course";
import Enrollment from "../../../../models/Enrollment";

function authenticate(request) {
  const token = getTokenFromHeader(
    request.headers.get("authorization")
  );

  return token ? verifyToken(token) : null;
}

// GET - Student's enrolled courses
export async function GET(request) {
  try {
    const user = authenticate(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "Student") {
      return NextResponse.json(
        { message: "Students only" },
        { status: 403 }
      );
    }

    await connectDB();

    const enrollments = await Enrollment.find({
      student: user.userId,
    })
      .populate({
        path: "course",
        populate: {
          path: "teacher",
          select: "username email",
        },
      })
      .sort({ enrolledAt: -1 });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

// POST - Student enrolls in course
export async function POST(request) {
  try {
    const user = authenticate(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "Student") {
      return NextResponse.json(
        { message: "Students only" },
        { status: 403 }
      );
    }

    const { courseId } = await request.json();

    if (!mongoose.isValidObjectId(courseId)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    if (course.status !== "Open") {
      return NextResponse.json(
        { message: "Course is not open" },
        { status: 400 }
      );
    }

    const existing = await Enrollment.findOne({
      student: user.userId,
      course: courseId,
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already enrolled" },
        { status: 409 }
      );
    }

    const enrolledCount =
      await Enrollment.countDocuments({
        course: courseId,
      });

    if (enrolledCount >= course.maxStudent) {
      return NextResponse.json(
        { message: "Course is full" },
        { status: 400 }
      );
    }

    const enrollment = await Enrollment.create({
      student: user.userId,
      course: courseId,
    });

    return NextResponse.json(
      {
        message: "Enrollment successful",
        enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Already enrolled" },
        { status: 409 }
      );
    }

    console.error(error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
