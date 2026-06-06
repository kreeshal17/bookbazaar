import { cookies } from "next/headers";


export async function POST(req:Request)
{
 const session= await cookies()
 session.delete("session")

 return Response.json({
    message:"logout sucessfully"
 })


}