"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";

interface AdminStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  seller: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  };
  stats: {
    productCount: number;
    orderCount: number;
    totalSold: number;
    revenue: number;
  };
  books: {
    id: string;
    title: string;
    author: string | null;
    isbn: string | null;
    price: number;
    stockQty: number;
    isActive: boolean;
    createdAt: string;
    soldQty: number;
    salesAmount: number;
  }[];
  sales: {
    id: string;
    orderId: string;
    bookTitle: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    orderStatus: string;
    customerName: string;
    customerPhone: string;
    createdAt: string;
  }[];
}

export default function AdminPage() {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyStoreId, setBusyStoreId] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get<{ stores: AdminStore[] }>(
        "/api/admin/stores"
      );
      setStores(response.data.stores);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to load admin data");
      } else {
        setError("Unable to load admin data");
      }
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    return stores.reduce(
      (acc, store) => {
        acc.stores += 1;
        acc.products += store.stats.productCount;
        acc.orders += store.stats.orderCount;
        acc.revenue += store.stats.revenue;
        return acc;
      },
      { stores: 0, products: 0, orders: 0, revenue: 0 }
    );
  }, [stores]);

  async function toggleBan(store: AdminStore) {
    setBusyStoreId(store.id);
    setError("");
    setMessage("");

    try {
      await axios.patch(`/api/admin/stores/${store.id}`, {
        isActive: !store.isActive,
      });

      setStores((current) =>
        current.map((item) =>
          item.id === store.id ? { ...item, isActive: !store.isActive } : item
        )
      );
      setMessage(store.isActive ? "Seller banned." : "Seller approved.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to update seller");
      } else {
        setError("Unable to update seller");
      }
    } finally {
      setBusyStoreId(null);
    }
  }

  async function deleteSeller(store: AdminStore) {
    const confirmed = window.confirm(
      `Delete seller ${store.seller.full_name} and store ${store.name}? This removes their products and related store sales records.`
    );

    if (!confirmed) {
      return;
    }

    setBusyStoreId(store.id);
    setError("");
    setMessage("");

    try {
      await axios.delete(`/api/admin/stores/${store.id}`);
      setStores((current) => current.filter((item) => item.id !== store.id));
      setMessage("Seller deleted successfully.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to delete seller");
      } else {
        setError("Unable to delete seller");
      }
    } finally {
      setBusyStoreId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="mt-6 space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Admin control
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Stores, Products and Sales
          </h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            Review seller stores, inspect all products by store, track received
            sales, and manage seller access.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label="Stores" value={totals.stores} />
          <SummaryCard label="Products" value={totals.products} />
          <SummaryCard label="Orders" value={totals.orders} />
          <SummaryCard
            label="Revenue"
            value={`Rs. ${totals.revenue.toLocaleString()}`}
          />
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
            {message}
          </div>
        )}

        {stores.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No seller stores found</h2>
            <p className="mt-2 text-slate-500">
              Stores will appear here once sellers create them.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {stores.map((store) => (
              <section
                key={store.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">{store.name}</h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          store.isActive
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {store.isActive ? "APPROVED" : "PENDING"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Seller: {store.seller.full_name} · {store.seller.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Store slug: {store.slug}
                    </p>
                    {store.description && (
                      <p className="mt-3 max-w-3xl text-slate-600">
                        {store.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      disabled={busyStoreId === store.id}
                      onClick={() => toggleBan(store)}
                      className={`rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        store.isActive
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {store.isActive ? "Ban Seller" : "Approve Seller"}
                    </button>

                    <button
                      type="button"
                      disabled={busyStoreId === store.id}
                      onClick={() => deleteSeller(store)}
                      className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete Seller
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <SummaryCard label="Products" value={store.stats.productCount} />
                  <SummaryCard label="Orders" value={store.stats.orderCount} />
                  <SummaryCard label="Sold Qty" value={store.stats.totalSold} />
                  <SummaryCard
                    label="Sales"
                    value={`Rs. ${store.stats.revenue.toLocaleString()}`}
                  />
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-bold">Products</h3>
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="px-4 py-3">Book</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3">Sold</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {store.books.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-6 text-center text-slate-500"
                              >
                                No products in this store.
                              </td>
                            </tr>
                          ) : (
                            store.books.map((book) => (
                              <tr key={book.id}>
                                <td className="px-4 py-3">
                                  <p className="font-semibold">{book.title}</p>
                                  <p className="text-xs text-slate-500">
                                    {book.author || "Unknown author"} · ISBN:{" "}
                                    {book.isbn || "N/A"}
                                  </p>
                                </td>
                                <td className="px-4 py-3">Rs. {book.price}</td>
                                <td className="px-4 py-3">{book.stockQty}</td>
                                <td className="px-4 py-3">
                                  {book.soldQty}
                                  <p className="text-xs text-slate-500">
                                    Rs. {book.salesAmount}
                                  </p>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold">Sales Details</h3>
                    <div className="mt-3 space-y-3">
                      {store.sales.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                          No sales yet.
                        </div>
                      ) : (
                        store.sales.slice(0, 8).map((sale) => (
                          <div
                            key={sale.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold">{sale.bookTitle}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Order #{sale.orderId.slice(0, 8)} ·{" "}
                                  {new Date(sale.createdAt).toLocaleDateString()}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {sale.customerName} · {sale.customerPhone}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="font-bold">
                                  Rs. {sale.totalPrice}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Qty {sale.quantity} · {sale.orderStatus}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
