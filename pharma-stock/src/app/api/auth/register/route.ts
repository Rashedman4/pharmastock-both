import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, phoneNumber } = body;
    const client = await pool.connect();

    // Check if the user already exists
    const existingUserQuery = `SELECT * FROM users WHERE email = $1`;
    const existingUser = await client.query(existingUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      client.release();
      if (existingUser.rows[0].provider === "google") {
        return NextResponse.json(
          { message: "Email Rigestered with google" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }
    const deleteOldPendingUsersQuery = `DELETE FROM pendingusers WHERE created_at < NOW() - INTERVAL '15 minutes' OR email = $1`;
    await client.query(deleteOldPendingUsersQuery, [email]);
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = uuidv4().slice(0, 6).toUpperCase();

    // Insert the new user into the database
    const insertUserQuery = `INSERT INTO pendingusers (firstname, lastname, email, password, verification_code,phonenumber,created_at) VALUES ($1, $2, $3, $4, $5, $6,Now()) RETURNING *`;
    const newUser = await client.query(insertUserQuery, [
      firstName,
      lastName,
      email,
      hashedPassword,
      verificationCode,
      phoneNumber.length != 0 ? phoneNumber : null,
    ]);

    sendEmail(email, "Verification Code", verificationCode);
    client.release();
    return NextResponse.json(
      {
        message:
          "Registration successful. Verification code sent to your email.",
        user: newUser.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inserting user into DB", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
