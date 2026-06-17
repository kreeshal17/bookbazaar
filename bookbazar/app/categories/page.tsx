import Footer from "@/components/home/footer";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const categories = [
  {
    name: "Fiction",
    slug: "fiction",
    description: "Stories, novels, and imaginative worlds.",
  },
  {
    name: "Non-Fiction",
    slug: "non-fiction",
    description: "Biographies, history, essays, and real-world reads.",
  },
  {
    name: "Self Improvement",
    slug: "self-improvement",
    description: "Personal growth, habits, mindset, and productivity.",
  },
  {
    name: "Business",
    slug: "business",
    description: "Entrepreneurship, management, finance, and growth.",
  },
  {
    name: "Technology",
    slug: "technology",
    description: "Programming, software, AI, and modern tech resources.",
  },
  {
    name: "Academic",
    slug: "academic",
    description: "College, university, reference, and course books.",
  },
  {
    name: "Others",
    slug: "others",
    description: "More useful books across different interests.",
  },
];

export default function CategoriesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Browse by category
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-5xl">
              Find Books by Interest
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Choose a category to view approved seller books from that section.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/books?category=${category.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-700">
                  📚
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-900 transition group-hover:text-indigo-600">
                  {category.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {category.description}
                </p>
                <span className="mt-5 inline-block text-sm font-semibold text-indigo-600">
                  View books
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
