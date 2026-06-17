"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Onboard() {
  const router = useRouter();

  const [storename, setStorename] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function uploadIdentity() {
    if (!identityFile) {
      throw new Error("Identity document is required");
    }

    const formData = new FormData();
    formData.append("file", identityFile);

    const response = await axios.post("/api/upload", formData);
    return response.data.url as string;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!/^\+?[0-9\s-]{7,15}$/.test(phone.trim())) {
        throw new Error("Please enter a valid phone number");
      }

      const identityUrl = await uploadIdentity();

      const response = await axios.post("/api/store/create", {
        storename,
        description,
        phone,
        identityUrl,
      });

      setMessage(response.data.message);

      setTimeout(() => {
        router.push("/seller/dashboard");
      }, 1200);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Something went wrong");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Seller verification
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Create Your Store
          </h1>
          <p className="mt-2 text-slate-500">
            Submit your store details for admin approval.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Your identity information is collected solely to protect against fraud
          and verify seller authenticity. It will only be reviewed by BookMandu
          admin.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Store Name
            </label>
            <input
              type="text"
              value={storename}
              onChange={(e) => setStorename(e.target.value)}
              placeholder="Krishal Book Hub"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers about your store..."
              rows={4}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Identity Document
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setIdentityFile(e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
