//src/app/api/course/route.js

/**
 * Course endpoints go here
 */


import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { verifyToken, getTokenFromHeader } from "../../../lib/auth";
import Course from "../../../../models/Course";
import Enrollment from "../../../../models/Enrollment";

// Get authenticated user from JWT
function authenticate(request) {
  const token = getTokenFromHeader(
    request.headers.get("authorization")
  );

  if (!token) return null;

  return verifyToken(token);
}

// GET /api/course
// Teachers see their own courses.
// Students see all courses except Cancel.
export async function GET(request) {
  try {
    const user = authenticate(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();

    let courses;

    if (user.role === "Teacher") {
      // Teachers can only view their own courses
      courses = await Course.find({
        teacher: user.userId,
      })
        .populate("teacher", "username email")
        .sort({ createdAt: -1 });

    } else if (user.role === "Student") {
      // Students cannot see cancelled courses
      courses = await Course.find({
        status: { $ne: "Cancel" },
      })
        .populate("teacher", "username email")
        .sort({ createdAt: -1 });

      // Filter by course name or teacher name
      if (search) {
        courses = courses.filter((course) => {
          const courseName = course.name.toLowerCase();
          const teacherName =
            course.teacher?.username?.toLowerCase() || "";

          return (
            courseName.includes(search.toLowerCase()) ||
            teacherName.includes(search.toLowerCase())
          );
        });
      }
    } else {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Add enrollment information
    const results = await Promise.all(
      courses.map(async (course) => {
        const enrolledCount =
          await Enrollment.countDocuments({
            course: course._id,
          });

        return {
          ...course.toObject(),
          enrolledCount,
          availableSeats: Math.max(
            0,
            course.maxStudent - enrolledCount
          ),
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET courses error:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/course
// Only Teachers can create courses.
export async function POST(request) {
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
        { message: "Only Teachers can create courses" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      name,
      duration,
      topics,
      price,
      maxStudent,
      status = "Open",
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !Number.isInteger(duration) ||
      duration < 1 ||
      !Array.isArray(topics) ||
      topics.length === 0 ||
      !topics.every(
        (topic) =>
          typeof topic === "string" && topic.trim()
      ) ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(maxStudent) ||
      maxStudent < 1 ||
      !["Open", "Close", "Cancel"].includes(status)
    ) {
      return NextResponse.json(
        { message: "Invalid course information" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.create({
      name: name.trim(),
      duration,
      topics: topics.map((topic) => topic.trim()),
      price,
      maxStudent,
      status,
      teacher: user.userId,
    });

    return NextResponse.json(
      {
        message: "Course created successfully",
        course,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST course error:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
