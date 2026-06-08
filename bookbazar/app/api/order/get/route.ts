
import { decrypt } from "@/app/lib/session"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export async function GET(){


const sessionCookie= await cookies()
const session= sessionCookie.get("session")?.value

if(!session)
{

    return Response.json({


    message:"uynauthorized one"
    },
{status:401})
}

const payload=await decrypt(session)


if(!payload)
{

    return Response.json({


    message:"invalid session"
    },
{status:401})
}


const {id}= payload


const result= await prisma.order.findMany({
   where:{
     buyerId:id as string
   },
   include:{
    items:{
        include:{
            book:true,
            store:true
        }
    }
   },
   orderBy:{
    createdAt:"desc"
   }





 })

return Response.json(result)
}