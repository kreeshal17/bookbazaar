"use client";

import axios from "axios";
import { FormEvent, useEffect, useState } from "react";

interface BookForm {
  title: string;
  author: string;
  isbn: string;
  categoryId: string;
  price: string;
  stockQty: string;
  description: string;
}

interface Book {
  id: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  author: string | null;
  isbn: string | null;
  price: number | string;
  stockQty: number;
}

const emptyForm: BookForm = {
  title: "",
  author: "",
  isbn: "",
  categoryId: "",
  price: "",
  stockQty: "",
  description: "",
};

export default function AddBookPage() {
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [editBookId, setEditBookId] = useState<string | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isEditing = Boolean(editBookId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEditBookId(params.get("id"));
  }, []);

  useEffect(() => {
    async function loadBook(bookId: string) {
      setLoadingBook(true);
      setError("");
      setMessage("");

      try {
        const response = await axios.get<{ book: Book }>(`/api/book/${bookId}`);
        const book = response.data.book;

        setForm({
          title: book.title || "",
          author: book.author || "",
          isbn: book.isbn || "",
          categoryId: book.categoryId || "",
          price: String(book.price || ""),
          stockQty: String(book.stockQty || ""),
          description: book.description || "",
        });
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Unable to load this book.");
        } else {
          setError("Unable to load this book.");
        }
      } finally {
        setLoadingBook(false);
      }
    }

    if (editBookId) {
      loadBook(editBookId);
    }
  }, [editBookId]);

  function updateField(field: keyof BookForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      title: form.title,
      author: form.author,
      isbn: form.isbn,
      categoryId: form.categoryId,
      price: Number(form.price),
      stockQty: Number(form.stockQty),
      description: form.description,
    };

    try {
      if (editBookId) {
        await axios.patch(`/api/book/${editBookId}`, payload);
        setMessage("Book updated successfully.");
      } else {
        await axios.post("/api/book/create", payload);
        setMessage("Book added successfully.");
        setForm(emptyForm);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.errors?.issues?.[0]?.message ||
            "Something went wrong."
        );
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
              {isEditing ? "Edit inventory" : "New inventory"}
            </p>

            <h1 className="text-4xl font-bold text-slate-900">
              {isEditing ? "Edit Book" : "Add New Book"}
            </h1>

            <p className="mt-2 text-slate-500">
              {isEditing
                ? "Update the details for this store item."
                : "Add a new book to your store inventory."}
            </p>
          </div>

          <a
            href="/seller/dashboard/mybook"
            className="rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            View My Books
          </a>
        </div>

        {loadingBook ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center font-medium text-slate-600">
            Loading book details...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {message && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block font-medium text-slate-700">
                    Book Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Enter book title"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-slate-700">
                    Author
                  </label>

                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => updateField("author", e.target.value)}
                    placeholder="Enter author name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-slate-700">
                    ISBN
                  </label>

                  <input
                    type="text"
                    value={form.isbn}
                    onChange={(e) => updateField("isbn", e.target.value)}
                    placeholder="Enter ISBN number"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-medium text-slate-700">
                      Price
                    </label>

                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      placeholder="299"
                      min="1"
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-slate-700">
                      Stock Quantity
                    </label>

                    <input
                      type="number"
                      value={form.stockQty}
                      onChange={(e) => updateField("stockQty", e.target.value)}
                      placeholder="10"
                      min="0"
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-slate-700">
                    Category
                  </label>

                  <select
                    value={form.categoryId}
                    onChange={(e) => updateField("categoryId", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">Select Category</option>
                    <option value="programming">Programming</option>
                    <option value="curriculum">Curriculum</option>
                    <option value="history">History</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={6}
                    placeholder="Write book description..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-slate-300 px-8 py-4 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      Clear Changes
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-10 py-4 font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {saving
                      ? "Saving..."
                      : isEditing
                        ? "Update Book"
                        : "Add Book"}
                  </button>
                </div>
              </div>

              <div>
                <div className="sticky top-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-slate-200 text-7xl">
                    📚
                  </div>

                  <div className="mt-6">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {form.title || "Book Title"}
                    </h2>

                    <p className="mt-1 text-slate-500">
                      {form.author || "Author Name"}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        Rs. {form.price || "0"}
                      </span>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        Stock {form.stockQty || "0"}
                      </span>
                    </div>

                    <div className="mt-6">
                      <h3 className="mb-2 font-semibold text-slate-700">
                        Category
                      </h3>

                      <p className="text-slate-500">
                        {form.categoryId || "No category selected"}
                      </p>
                    </div>

                    <div className="mt-6">
                      <h3 className="mb-2 font-semibold text-slate-700">
                        Description
                      </h3>

                      <p className="line-clamp-6 text-sm text-slate-500">
                        {form.description ||
                          "Your book description will appear here as you type."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
