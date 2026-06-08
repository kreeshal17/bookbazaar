import prisma from "@/lib/prisma";
import { encrypt } from "@/app/lib/session";
import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";
import { z } from "zod";

export const orderSchema = z.object({
  fullName: z
    .string()
    
    .min(2, "Name must be at least 2 characters"),


  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits"),

  shippingAddr: z
    .string()
    .min(5, "Address is required"),

  city: z
    .string()
    .min(2, "City is required"),

  state: z
    .string()
    .min(2, "State is required"),

  postalCode: z
    .string()
    .min(4, "Postal code is required"),

  notes: z
    .string()
    .optional()
});
export async function POST(req:Request)
{

const sessionCookie= await cookies()

const session = sessionCookie.get("session")?.value

if(!session)
{

    return Response.json({


    message:"unauthorized access"
    },
    {
status:401})
}

const payload= await decrypt(session);
const body= await req.json()
const schema= orderSchema.safeParse(body);

if(!payload)
{

    return Response.json({


    message:"invalid session"
    },
{status:401})
}
if(!schema.success)
{
  return Response.json(
    {
      message: schema.error.flatten()
    },
    {
      status:400
    }
  )
}

const {id}=payload


const {fullName,phone,shippingAddr,city,state, postalCode}= schema.data

const cartitems=await prisma.cartItem.findMany({
   where:{
    userId:id as string
   }
  ,include:{
    book:true
  }


})
const total= cartitems.reduce(  (sum,items)=> sum+ items.quantity *Number( items.book.price),0 )

const result=await prisma.order.create({
    data:{
        buyerId:id as string,
       fullName,
       totalAmount:total,
       phone,
        shippingAddr,
        city,
        state,
        postalCode





    }
})
await prisma.cartItem.deleteMany({
  where:{
    userId:id as string
  }
})

return Response.json(
  {
    message: "Order created successfully",
    order: result
  },
  {
    status: 201
  }
)

}


