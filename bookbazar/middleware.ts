
import {NextRequest,NextResponse} from "next/server"
import { decrypt } from "./lib/middleware-session"
export async function middleware(req:NextRequest)
{

const session=req.cookies.get("session")?.value


if(!session)
{
return NextResponse.redirect(


new URL("/login",req.url)
)


}
const payload=await decrypt(session)


if(!payload)
{
return NextResponse.redirect(


new URL("/login",req.url))

}

const path=req.nextUrl.pathname
const role=payload.role


if(path.startsWith("/admin")&& role!="ADMIN")
{
 return NextResponse.redirect(new URL ("/login",req.url))


}


if(path.startsWith("/seller") && role!="SELLER")

    {
        return NextResponse.redirect(new URL ("/login",req.url))
    }
 if (
    path.startsWith("/buyer") &&
    role !== "BUYER"
  ) {
    return NextResponse.redirect(
      new URL("/", req.url)
    );
  }


  return NextResponse.next();

}
export const config={
    matcher:[
        "/admin/:path*",
        "/buyer/:path*",
        "/seller/:path*"
        ]}



