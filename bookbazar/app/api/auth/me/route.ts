import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export  async function GET(res:Request)
{

    const cookieStore= await cookies()

    const session= cookieStore.get("session")?.value

    if(!session)
    {
        return Response.json(null)
    }
    const payload=await decrypt(session)

    if(!payload)
    {
        return Response.json(null)
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: {
            isBlocked: true,
        },
    })

    if (!user || user.isBlocked) {
        return Response.json(null)
    }

    return Response.json(payload)



    
}