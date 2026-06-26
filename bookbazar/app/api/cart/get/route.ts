import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { requireActiveUser } from "@/app/lib/active-user";
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

const { error, user } = await requireActiveUser()

if (error) {
    return error
}

const cartitems= await prisma.cartItem.findMany({
where:{
    userId:user.id,
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
