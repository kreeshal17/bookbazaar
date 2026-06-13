import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
export async function GET(){

const sessionCOokie= await cookies();


const session=sessionCOokie.get("session")?.value;
if(!session)
{
    return Response.json({
        message:"unauthorized user"
    },{
        status:401
    })
}

const payload=await decrypt(session)

if(!payload)
{
    return Response.json({
        message:"invalid session"
    },{
        status:401
    })
}
const {id}=payload

const cartitems= await prisma.cartItem.findMany({
where:{
    userId:id as string,
    book:{
        isActive:true,
        store:{
            isActive:true
        }
    }
},
include:{
book:true
}

})

return Response.json(cartitems)



}
