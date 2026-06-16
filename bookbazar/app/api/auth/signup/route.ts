import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { userSchema } from "@/prisma/schemas/user.schemas";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/resend/sendverificationemail";
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = userSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          message: "Validation failed",
          errors: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;


    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return Response.json(
        {
          message: "Email already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        full_name: data.name,
        email: data.email,
        password_hash: hashedPassword,
        role: data.role,
      },
    });

    console.log("User created");
  const token= randomBytes(32).toString("hex")
    await prisma.verificationToken.create({
      data:{
        token,
        userId:user.id,
        expiresAt:new Date(Date.now()+10*60*1000)
      }
    })
    console.log("Token created");

    await sendVerificationEmail(data.email,token,data.name)
    console.log("Email sent");

    return Response.json(
      {
        message: "Successfully created an account",
        data: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);


}


 



    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
