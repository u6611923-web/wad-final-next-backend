//src/app/api/course/[course_id]/route.js

/**
 * Specific course id API endpoints go here.
 */


import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../../lib/mongodb";
import { verifyToken, getTokenFromHeader } from "../../../../lib/auth";
import Course from "../../../../../models/Course";
import Enrollment from "../../../../../models/Enrollment";

// Authenticate incoming requests
function authenticate(request) {
  const token = getTokenFromHeader(
    request.headers.get("authorization")
  );

  if (!token) return null;

  return verifyToken(token);
}

// GET - View course details
export async function GET(request, context) {
  try {
    const { course_id } = await context.params;
    const user = authenticate(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!mongoose.isValidObjectId(course_id)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.findById(course_id)
      .populate("teacher", "username email");

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    if (user.role === "Teacher") {
      if (course.teacher._id.toString() !== user.userId) {
        return NextResponse.json(
          { message: "Forbidden" },
          { status: 403 }
        );
      }
    } else if (user.role === "Student") {
      if (course.status === "Cancel") {
        return NextResponse.json(
          { message: "Course unavailable" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const enrollments = await Enrollment.find({
      course: course_id,
    }).populate("student", "username email");

    return NextResponse.json({
      course,
      enrolledStudents:
        user.role === "Teacher"
          ? enrollments.map((e) => e.student)
          : undefined,
      enrolledCount: enrollments.length,
      availableSeats: Math.max(
        0,
        course.maxStudent - enrollments.length
      ),
    });
  } catch (error) {
    console.error("GET course error:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

// PUT - Teacher updates own course
export async function PUT(request, context) {
  try {
    const user = authenticate(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "Teacher") {
      return NextResponse.json(
        { message: "Teachers only" },
        { status: 403 }
      );
    }

    const { course_id } = await context.params;

    if (!mongoose.isValidObjectId(course_id)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.findOne({
      _id: course_id,
      teacher: user.userId,
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const allowedFields = [
      "name",
      "duration",
      "topics",
      "price",
      "maxStudent",
      "status",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        course.set(field, body[field]);
      }
    }

    // Do not reduce capacity below existing enrollment
    const enrolledCount = await Enrollment.countDocuments({
      course: course_id,
    });

    if (course.maxStudent < enrolledCount) {
      return NextResponse.json(
        { message: "Max students cannot be below current enrollment" },
        { status: 400 }
      );
    }

    await course.save();

    return NextResponse.json({
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("PUT course error:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

// DELETE - Teacher deletes own course if no enrollment
export async function DELETE(request, context) {
  try {
    const user = authenticate(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "Teacher") {
      return NextResponse.json(
        { message: "Teachers only" },
        { status: 403 }
      );
    }

    const { course_id } = await context.params;

    if (!mongoose.isValidObjectId(course_id)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.findOne({
      _id: course_id,
      teacher: user.userId,
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found or access denied" },
        { status: 404 }
      );
    }

    const enrolledCount = await Enrollment.countDocuments({
      course: course_id,
    });

    if (enrolledCount > 0) {
      return NextResponse.json(
        { message: "Cannot delete a course with enrolled students" },
        { status: 400 }
      );
    }

    await Course.deleteOne({
      _id: course_id,
      teacher: user.userId,
    });

    return NextResponse.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("DELETE course error:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
