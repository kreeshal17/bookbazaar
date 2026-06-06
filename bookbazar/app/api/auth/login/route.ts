import {z} from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { encrypt } from '@/app/lib/session'

const loginSchema=z.object({
    
    email:z.email(),
    password:z.string().min(8,"password must be of 8 integers")
    
    
    
})


export async function POST(req:Request){
    const cookieStore= await cookies()

    
    const body= await req.json()
    const result=loginSchema.safeParse(body)
    
    if(!result.success)
    {
        return Response.json({
              message: result.error.message


        },{
            status:401
        })



    }

    const user=await prisma.user.findUnique({
    where:{
        email:result.data.email
    },

    })

    if(!user)
    {
     return Response.json({

        message:"error no user found"
     })


    }


    const store = await prisma.store.findUnique({
  where: {
    sellerId: user.id
  }
})





const password=result.data.password
     console.log("EMAIL:", result.data.email)
console.log("USER:", user)
console.log("PASSWORD FROM FORM:", password)
console.log("HASH FROM DB:", user.password_hash)

     const validation=await  bcrypt.compare(password,user.password_hash)
console.log("VALIDATION:", validation)
if(!validation)
{
    return Response.json({
        message:"password and email doesnot matched"
    },{
        status:401
    })
}


const session = {
  id: user.id,
  email: user.email,
  role: user.role,
}
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
 
const token= await encrypt(session)

cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })

return Response.json({
  message:"sucessfully submitted",
  role:user.role,
  email:user.email,
  hasStore:!!store


    })
}

    








