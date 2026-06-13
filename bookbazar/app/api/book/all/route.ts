import prisma from "@/lib/prisma";

export async function GET(){

const data= await prisma.book.findMany({
where:{
    isActive:true,
    store:{
        isActive:true
    }


},
take:10,
orderBy:{
    createdAt:"desc"
}
})

return Response.json(data)
}
