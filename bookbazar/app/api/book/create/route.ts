import { decrypt } from "@/app/lib/session";
import prisma from "@/lib/prisma";
import { error } from "console";
import { cookies } from "next/headers";
import {z} from "zod"

const categoryLabels: Record<string, string> = {
  fiction: "Fiction",
  "non-fiction": "Non-Fiction",
  "self-improvement": "Self Improvement",
  business: "Business",
  technology: "Technology",
  academic: "Academic",
  others: "Others",
};

async function getCategoryId(categoryId?: string) {
  if (!categoryId) {
    return null;
  }

  const slug = categoryId.trim().toLowerCase();
  const name = categoryLabels[slug] || categoryId;

  const category = await prisma.category.upsert({
    where: {
      slug,
    },
    update: {
      name,
    },
    create: {
      name,
      slug,
    },
  });

  return category.id;
}



 const addBookSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters"),

  description: z
    .string()
    .optional(),

  author: z
    .string()
    .optional(),

  isbn: z
    .string()
    .optional(),

  price: z
    .number()
    .positive("Price must be greater than 0"),

  stockQty: z
    .number()
    .int()
    .min(0, "Stock cannot be negative"),

  categoryId: z
    .string()
    .optional(),

  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional(),
});

export async function POST(req:Request)
{



const body= await req.json()

const result= addBookSchema.safeParse(body)

const cookieStore= await cookies()


if (!result.success) {
  return Response.json(
    { errors: result.error },
    { status: 400 }
  );
}

const data=result.data
const categoryId = await getCategoryId(data.categoryId);

const sessionCookie= cookieStore.get("session")?.value
if (!sessionCookie) {
  return Response.json(
    { message: "Unauthorized" },
    { status: 401 }
  )
}

const payload=await decrypt(sessionCookie)
if (!payload) {
  return Response.json(
    { message: "Invalid session" },
    { status: 401 }
  )
}

const store= await prisma.store.findUnique({

    where:{
        sellerId:payload.id as string

    }
})

if (!store) {
  return Response.json(
    { message: "Store not found" },
    { status: 404 }
  )
}
const book=await prisma.book.create({
    data:{

          storeId:store.id,
          title:data.title,
          description:data.description,
          author:data.author,
          isbn:data.isbn,
          categoryId,
          price:data.price,
          stockQty:data.stockQty,
          imageUrl:data.imageUrl



    }


})
return Response.json(
  {
    message: "Book added successfully",
    book
  },
  {
    status: 201
  }
)



}

