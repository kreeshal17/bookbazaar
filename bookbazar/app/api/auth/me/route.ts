import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";

export  async function GET(res:Request)
{

    const cookieStore= await cookies()

    const session= cookieStore.get("session")?.value

    if(!session)
    {
        return Response.json(null)
    }
    const payload=await decrypt(session)

    return Response.json(payload)



    
}