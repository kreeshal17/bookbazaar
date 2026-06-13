import prisma from "@/lib/prisma";
import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } =
    await req.json();

  const books = await prisma.book.findMany({
    take: 100,
    include: {
      store: true,
    },
  });

  const booksContext = books
    .map(
      (book) => `
Title: ${book.title}
Author: ${book.author}
Price: ₹${book.price}
Description: ${book.description ?? "No description"}
Store: ${book.store.name}
`
    )
    .join("\n");

  const result = streamText({
    model: google("gemini-2.5-flash"),

system: `
You are BookMandu AI — a book assistant ONLY for the BookMandu marketplace.

Your ONLY job is to help users find, compare, and get information about books available on BookMandu.

Available Books in our inventory:
${booksContext}

STRICT RULES:
- ONLY talk about books from the list above. Nothing else.
- If a user asks about a book NOT in the list, say: "That book is not currently available on BookMandu. Here are some similar books you might like:" and suggest the closest match from the list.
- NEVER make up book titles, authors, prices, or descriptions.
- ALWAYS mention the price and store name when recommending a book.
- If the user asks anything unrelated to books (weather, coding, general questions etc.), say: "I'm only here to help you find books on BookMandu! What kind of book are you looking for?"
- Keep responses short and helpful.
- If no books match the user's request at all, say: "We don't have that in stock right now. Check back soon!"
`,

    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}