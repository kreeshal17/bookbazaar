import {z} from "zod"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/app/lib/session"
 const storeSchema = z.object({
  storename: z
    .string()
    .min(3, "Store name must be at least 3 characters")
    .max(50, "Store name too long"),

  description: z
    .string()
    .min(10, "Description too short")
    .max(500, "Description too long")
})

export async function POST(req:Request)
{
    const body= await req.json()

const result = storeSchema.safeParse(body)

if (!result.success) {
  return Response.json(
    {
      message: "Validation failed",
      errors: result.error
    },
    {
      status: 400
    }
  )
}

const{storename,description}= result.data


const  cookieStore=await cookies()
  
const sessionCookie=cookieStore.get("session")?.value
   if (!sessionCookie) {
      return Response.json(
        {
          message: "Unauthorized"
        },
        {
          status: 401
        }
      )
    }

    const payload=await decrypt(sessionCookie)

    if (!payload) {
      return Response.json(
        {
          message: "Invalid session"
        },
        {
          status: 401
        }
      )
    }



    const existingStore=await prisma.store.findUnique({

        where:{

            sellerId:payload.id as string
        }
    })


   if (existingStore) {
      return Response.json(
        {
          message: "Store already exists"
        },
        {
          status: 409
        }
      )
    }

const slug=storename.trim().toLowerCase().replace(" ","-")


    const store =
      await prisma.store.create({
        data: {
          sellerId: payload.id as string,
          name: storename,
          slug,
          description
        }
      })






  return Response.json(
      {
        message: "Store created successfully",
        store
      },
      {
        status: 201
      }
    )

  
  }
