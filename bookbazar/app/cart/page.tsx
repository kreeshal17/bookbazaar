"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar"
import Footer from "@/components/home/footer"
import Image from "next/image";
interface CartItem {
  id: string;
  quantity: number;
  book: {
    title: string;
    description: string | null;
    author: string | null;
    price: number;
    imageUrl:string|null
  };
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useEffect(() => {
    getCart();
  }, []);

  async function getCart() {
    setError("");

    try {
      const result = await axios.get<CartItem[]>("/api/cart/get");
      setCartItems(result.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to load cart");
      } else {
        setError("Unable to load cart");
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(id: string, action: "increment" | "decrement") {
    setBusyItemId(id);
    setError("");

    try {
      const response = await axios.patch(`/api/cart/${id}`, { action });
      const updatedItem = response.data.cartItem as CartItem | null;

      setCartItems((current) => {
        if (!updatedItem) {
          return current.filter((item) => item.id !== id);
        }

        return current.map((item) => (item.id === id ? updatedItem : item));
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to update cart");
      } else {
        setError("Unable to update cart");
      }
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(id: string) {
    setBusyItemId(id);
    setError("");

    try {
      await axios.delete(`/api/cart/${id}`);
      setCartItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to remove item");
      } else {
        setError("Unable to remove item");
      }
    } finally {
      setBusyItemId(null);
    }
  }

  const totals = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        acc.quantity += item.quantity;
        acc.amount += item.quantity * Number(item.book.price);
        return acc;
      },
      { quantity: 0, amount: 0 }
    );
  }, [cartItems]);

  if (loading) {
    return (
      <>
      <Navbar/>
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
      <Footer/>
      </>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Your Cart
          </h1>
          <p className="mt-2 text-slate-500">
            Review your selected books before checkout.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Your cart is empty
            </h2>
            <p className="mt-2 text-slate-500">
              Add books to your cart and they will show up here.
            </p>
            <button
              onClick={() => router.push("/books")}
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Browse Books
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 sm:flex-row">
                    {/* <div className="flex h-32 w-full items-center justify-center rounded-xl bg-indigo-50 text-5xl sm:w-24">
                      📚
                    </div> */}


<div className="flex h-32 w-full items-center justify-center rounded-xl bg-indigo-50 sm:w-24 overflow-hidden relative">
  {item.book.imageUrl ? (
    <Image
      src={item.book.imageUrl}
      alt={item.book.title}
      fill
      className="object-cover"
      sizes="96px"
    />
  ) : (
    <span className="text-5xl">📚</span>
  )}
</div>



                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-slate-900">
                        {item.book.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.book.author || "Unknown Author"}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                        {item.book.description || "No description available."}
                      </p>

                      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-bold text-indigo-600">
                            Rs. {Number(item.book.price)}
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            Total: Rs.{" "}
                            {(item.quantity * Number(item.book.price)).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, "decrement")}
                            disabled={busyItemId === item.id}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            -
                          </button>

                          <span className="min-w-10 rounded-full bg-slate-100 px-4 py-2 text-center font-bold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.id, "increment")}
                            disabled={busyItemId === item.id}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            +
                          </button>

                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={busyItemId === item.id}
                            className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-slate-600">
                  <span>Total Quantity</span>
                  <span className="font-semibold">{totals.quantity}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Total Items</span>
                  <span className="font-semibold">{cartItems.length}</span>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex justify-between text-xl font-bold text-slate-900">
                  <span>Subtotal</span>
                  <span>Rs. {totals.amount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white transition hover:bg-indigo-700"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => router.push("/books")}
                className="mt-3 w-full rounded-xl border border-slate-300 py-4 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    <Footer/>
    </>
  );
}
