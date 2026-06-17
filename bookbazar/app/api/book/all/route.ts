import prisma from "@/lib/prisma";

export async function GET(req: Request){
const { searchParams } = new URL(req.url)
const search = searchParams.get("search")?.trim()
const category = searchParams.get("category")?.trim()

const data= await prisma.book.findMany({
where:{
    isActive:true,
    store:{
        isActive:true,
        isApproved:true
    },
    ...(category
      ? {
          category: {
            slug: category,
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              author: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              isbn: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {})
},
take: search ? 50 : 10,
orderBy:{
    createdAt:"desc"
}
})

return Response.json(data)
}