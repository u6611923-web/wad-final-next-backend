# Online Course Service — Backend

**CSX4107 Web Application Development — Final Examination 2026**

## Project Description

The Online Course Service is a web application that allows Teachers to manage online courses and Students to browse and enroll in available courses.

This repository contains the backend API built with Next.js and MongoDB.

## Technologies Used

- Next.js
- Node.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs

## Features

### Authentication
- Login using email and password
- JWT-based authentication
- Student and Teacher roles
- Backend authorization and course ownership validation

### Teacher Functions
- View their own courses
- Create courses
- View course details and enrolled Students
- Update their own courses
- Delete courses only if no Students have enrolled

### Student Functions
- View available courses
- Search by course name or Teacher name
- View course details
- Enroll in Open courses with available seats
- Prevent duplicate enrollment
- View enrolled courses

### Course Status
- **Open:** Visible and available for enrollment when seats remain
- **Close:** Visible but unavailable for new enrollment
- **Cancel:** Hidden from Student course listings and unavailable for enrollment

## Test Accounts

All test accounts use the same dedicated demonstration password.

**Password for all six accounts:** `
Fl@sky2580

| Role | Email |
|---|---|
| Teacher | teacher1@example.com |
| Teacher | teacher2@example.com |
| Teacher | teacher3@example.com |
| Student