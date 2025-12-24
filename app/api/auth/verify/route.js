const { NextResponse } = require("next/server");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          isValid: false,
          message: "Token is required",
        },
        { status: 400 }
      );
    }

    try {
      const decoded = jwt.verify(token, SECRET_KEY);

      return NextResponse.json({
        isValid: true,
        message: "Token is valid",
        userType: decoded.userType,
        userId: decoded.id,
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return NextResponse.json(
          {
            isValid: false,
            message: "Token is expired",
          },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          {
            isValid: false,
            message: "Token is invalid",
          },
          { status: 401 }
        );
      }
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        isValid: false,
        message: "Token verification failed",
      },
      { status: 500 }
    );
  }
}

module.exports = { POST };
