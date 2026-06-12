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
    take: 20,
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
You are BookMandu AI.

You help users find books, compare books,
recommend books, and answer questions.

Available Books:

${booksContext}

Rules:
- Only recommend books from the list above.
- If a book is not available, say it is not currently available.
- Mention price when recommending books.
- Be friendly and concise.
`,

    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}