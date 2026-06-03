import {z} from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

 const loginSchema=z.object({

    email:z.email(),
    password:z.string().min(8,"password must be of 8 integers")



 })


export async function POST(req:Request){

    
    const body= await req.json()
    const result=loginSchema.safeParse(body)
    
    if(!result.success)
    {
        return Response.json({
              message: result.error


        },{
            status:401
        })



    }

    const user=await prisma.users.findUnique({
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


const password=result.data.password
     const pass=bcrypt.hash(password,10)
     

     const validation= bcrypt.compare(password,user.password_hash)

if(!validation)
{
    return Response.json({
        message:"password and email doesnot matched"
    })
}

return Response.json({
  message:"sucessfully submitted",
  role:user.role,
  email:user.role


    })
}

    









