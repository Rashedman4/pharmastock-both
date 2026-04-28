import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(body);

    const { email: userEmail, code } = body;

    const client = await pool.connect();
    // Check if the email and verification code match in the pending_users table
    const result = await client.query(
      `
        SELECT * FROM pendingusers WHERE email = $1 AND verification_code = $2
      `,
      [userEmail, code]
    );
    //AND NOW() - created_at < interval '15 minutes' if you want to ensure that the code is not expired
    // If the verification code is incorrect or not found, return an error
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid verification code or email." },
        { status: 400 }
      );
    }

    // If verification succeeds, move the data to the users table
    const { firstname, lastname, email, password, phonenumber } =
      result.rows[0];

    // Check for potential issues during the move to the final `users` table
    try {
      await client.query(
        `
          INSERT INTO users (firstname, lastname, email, password, phonenumber)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [firstname, lastname, email, password, phonenumber]
      );

      // Delete the user from the pending_users table after successful insertion
      await client.query(
        `
          DELETE FROM pendingusers WHERE email = $1
        `,
        [email]
      );

      client.release();
      return NextResponse.json(
        { message: "Verification successful and registration completed." },
        { status: 200 }
      );
    } catch (error) {
      // If there's a database error when moving data to `users`
      console.error("Error moving data to users table:", error);
      return NextResponse.json(
        {
          error:
            "Error completing the registration process. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error during verification:", error);
    return NextResponse.json(
      { error: "Error verifying the code." },
      { status: 500 }
    );
  }
}
