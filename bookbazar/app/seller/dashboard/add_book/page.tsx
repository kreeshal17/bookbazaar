"use client";

import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface BookForm {
  title: string;
  author: string;
  isbn: string;
  categoryId: string;
  price: string;
  originalPrice: string;
  stockQty: string;
  description: string;
  imageUrl: string | null;
  condition: string;
}

interface Book {
  id: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  author: string | null;
  isbn: string | null;
  price: number | string;
  originalPrice: number | string | null;
  stockQty: number;
  imageUrl: string | null;
  condition: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  stockQty?: string;
}

const emptyForm: BookForm = {
  title: "",
  author: "",
  isbn: "",
  categoryId: "",
  price: "",
  originalPrice: "",
  stockQty: "",
  description: "",
  imageUrl: "",
  condition: "NEW",
};

const categories = [
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-Fiction" },
  { value: "self-improvement", label: "Self Improvement" },
  { value: "business", label: "Business" },
  { value: "technology", label: "Technology" },
  { value: "academic", label: "Academic" },
  { value: "others", label: "Others" },
];

const conditions = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "ACCEPTABLE", label: "Acceptable" },
  { value: "OLD", label: "Old" },
];

const conditionColors: Record<string, string> = {
  NEW: "bg-green-100 text-green-700",
  LIKE_NEW: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-blue-100 text-blue-700",
  ACCEPTABLE: "bg-yellow-100 text-yellow-700",
  OLD: "bg-red-100 text-red-700",
}

export default function AddBookPage() {
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [editBookId, setEditBookId] = useState<string | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
          imageUrl: book.imageUrl || "",
          author: book.author || "",
          isbn: book.isbn || "",
          categoryId: book.categoryId || "",
          price: String(book.price || ""),
          originalPrice: String(book.originalPrice || ""),
          stockQty: String(book.stockQty || ""),
          description: book.description || "",
          condition: book.condition || "NEW",
        });
        if (book.imageUrl) setPreview(book.imageUrl);
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
    if (editBookId) loadBook(editBookId);
  }, [editBookId]);

  function updateField(field: keyof BookForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
    setError("");
    setErrors({});
    setFile(null);
    setPreview(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) setPreview(URL.createObjectURL(selected));
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!form.title.trim()) {
      newErrors.title = "Title is required"
    } else if (form.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters"
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required"
    } else if (form.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters"
    } else if (form.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters"
    }

    if (!form.price) {
      newErrors.price = "Price is required"
    } else if (Number(form.price) <= 0) {
      newErrors.price = "Price must be greater than 0"
    }

    if (form.originalPrice && Number(form.originalPrice) <= 0) {
      newErrors.originalPrice = "Original price must be greater than 0"
    }

    if (form.originalPrice && Number(form.originalPrice) <= Number(form.price)) {
      newErrors.originalPrice = "Original price must be greater than selling price"
    }

    if (!form.stockQty) {
      newErrors.stockQty = "Stock quantity is required"
    } else if (Number(form.stockQty) < 0) {
      newErrors.stockQty = "Stock quantity cannot be negative"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      let imageUrl = form.imageUrl;

      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await axios.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data.url;
        setUploading(false);
      }

      const payload = {
        title: form.title,
        author: form.author,
        isbn: form.isbn,
        categoryId: form.categoryId,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        stockQty: Number(form.stockQty),
        description: form.description,
        condition: form.condition,
        imageUrl,
      };

      if (editBookId) {
        await axios.patch(`/api/book/${editBookId}`, payload);
        setMessage("Book updated successfully.");
      } else {
        await axios.post("/api/book/create", payload);
        setMessage("Book added successfully.");
        setForm(emptyForm);
        setFile(null);
        setPreview(null);
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
      setUploading(false);
    }
  }

  const discount = form.originalPrice && form.price && Number(form.originalPrice) > Number(form.price)
    ? Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)
    : null

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-indigo-600">
              {isEditing ? "Edit inventory" : "New inventory"}
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              {isEditing ? "Edit Book" : "Add New Book"}
            </h1>
            <p className="mt-1 text-slate-500">
              {isEditing ? "Update the details for this store item." : "Add a new book to your store inventory."}
            </p>
          </div>
          <Link
            href="/seller/dashboard/mybook"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
          >
            ← View My Books
          </Link>
        </div>

        {loadingBook ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            Loading book details...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">

                {message && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    ✓ {message}
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    ✕ {error}
                  </div>
                )}

                {/* Basic Info */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Basic Info</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Book Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="Enter book title"
                        className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-50 ${errors.title ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
                      />
                      {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Author</label>
                      <input
                        type="text"
                        value={form.author}
                        onChange={(e) => updateField("author", e.target.value)}
                        placeholder="Enter author name"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">ISBN</label>
                      <input
                        type="text"
                        value={form.isbn}
                        onChange={(e) => updateField("isbn", e.target.value)}
                        placeholder="Enter ISBN number"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Book Condition <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {conditions.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => updateField("condition", c.value)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition border ${
                              form.condition === c.value
                                ? conditionColors[c.value] + " border-transparent"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Pricing & Stock</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Selling Price (NPR) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rs.</span>
                        <input
                          type="number"
                          value={form.price}
                          onChange={(e) => updateField("price", e.target.value)}
                          placeholder="299"
                          min="1"
                          className={`w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-50 ${errors.price ? "border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
                        />
                      </div>
                      {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Original Price (NPR) <span className="text-slate-400 text-xs font-normal">for discount badge</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rs.</span>
                        <input
                          type="number"
                          value={form.originalPrice}
                          onChange={(e) => updateField("originalPrice", e.target.value)}
                          placeholder="499"
                          min="1"
                          className={`w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-50 ${errors.originalPrice ? "border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
                        />
                      </div>
                      {errors.originalPrice && <p className="mt-1 text-xs text-red-600">{errors.originalPrice}</p>}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.stockQty}
                        onChange={(e) => updateField("stockQty", e.target.value)}
                        placeholder="10"
                        min="0"
                        className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-50 ${errors.stockQty ? "border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
                      />
                      {errors.stockQty && <p className="mt-1 text-xs text-red-600">{errors.stockQty}</p>}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => updateField("categoryId", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Description <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          {form.description.length}/1000
                        </span>
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows={5}
                        placeholder="Write book description (min 20 characters)..."
                        className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-50 ${errors.description ? "border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
                      />
                      {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Book Cover</h2>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 transition hover:border-indigo-300 hover:bg-indigo-50">
                    <span className="text-3xl">📷</span>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">Click to upload image</p>
                      <p className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {file && <p className="mt-3 text-center text-xs text-slate-500">✓ Selected: {file.name}</p>}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Clear Changes
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-10 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {uploading ? "Uploading image..." : saving ? "Saving..." : isEditing ? "Update Book" : "Add Book"}
                  </button>
                </div>
              </div>

              {/* Right Preview */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Live Preview</p>

                  <div className="relative mb-4 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {preview ? (
                      <Image src={preview} alt="Book cover preview" fill className="object-cover" />
                    ) : (
                      <span className="text-6xl">📚</span>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">{form.title || "Book Title"}</h2>
                  <p className="mt-1 text-sm text-slate-500">{form.author || "Author Name"}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-indigo-600">Rs. {form.price || "0"}</span>
                      {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                        <span className="text-sm text-slate-400 line-through">Rs. {form.originalPrice}</span>
                      )}
                    </div>
                    {discount && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
                        {discount}% OFF
                      </span>
                    )}
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      Stock: {form.stockQty || "0"}
                    </span>
                    {form.condition && (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${conditionColors[form.condition]}`}>
                        {conditions.find(c => c.value === form.condition)?.label}
                      </span>
                    )}
                    {form.categoryId && (
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                        {categories.find((c) => c.value === form.categoryId)?.label}
                      </span>
                    )}
                  </div>

                  {form.description && (
                    <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-slate-500">{form.description}</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}