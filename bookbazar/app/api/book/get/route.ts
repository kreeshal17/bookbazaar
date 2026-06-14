import { decrypt } from "@/app/lib/session";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const startTime = Date.now();
  const sessionCookie = await cookies();

const sessionData= sessionCookie.get("session")?.value
if(!sessionData)
{

    return Response.json({


    message:"unauthorized access"
    },
    {
status:401})
}

const payload= await decrypt(sessionData);


if(!payload)
{

    return Response.json({


    message:"invalid session"
    },
{status:401})
}




const store= await prisma.store.findUnique({
    where:{
        sellerId:payload.id as string
    }
})


if(!store)
{
 return Response.json({


    message:"store not found"
    },
{status:404})


}


const result = await prisma.book.findMany({
    where: {
      storeId: store.id,
    },
  });

  const endTime = Date.now();
  console.log(`GET /api/book/get resolved in ${endTime - startTime}ms`);

  return Response.json({ books: result });
}
