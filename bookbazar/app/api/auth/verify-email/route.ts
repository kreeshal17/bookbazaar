import { NextRequest,NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req:NextRequest)
{

const token=req.nextUrl.searchParams.get("token")

 if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const record= await prisma.verificationToken.findUnique({
    where:{
        token:token
    }

  })

  if(!record ||record.expiresAt < new Date())
  {
     return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  await prisma.user.update({
    where:{
        id:record.userId
    },
data:{
    isVerified:true
}
}
  )
  await prisma.verificationToken.delete({
    where:{token}
  })


   return NextResponse.redirect(new URL('/login?verified=true',req.url))

}