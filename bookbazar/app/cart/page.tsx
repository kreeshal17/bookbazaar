'use client'
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface book{
id:string
quantity:number
book:{
title:string
description:String
author:string
price:number
}

}
export default function page(){





  

    const router=useRouter()
const handleshopping=()=>{
router.push("/")


}
const handleProceed=()=>{

router.push("/checkout")
}




const[cartitems,setCartItems]=useState<book[]>([])




const getCart = async () => {
  const result = await axios.get("/api/cart/get");

  if (result.data) {
    setCartItems(result.data);
  }
};

const decreaseQuantity = async (id: string) => {
  try {
    await axios.patch("/api/cart/decrease", {
      cartItemId: id,
    });

    await getCart();

  } catch (error) {
    console.log(error);
  }
};

useEffect(() => {
  getCart();
}, []);

return (
  <div className="min-h-screen bg-slate-50 py-12 px-6">
    <div className="mx-auto max-w-6xl">

      <h1 className="mb-8 text-4xl font-bold text-slate-900">
        🛒 Your Cart
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">

        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">

          {cartitems.map((c) => (

            <div
              key={c.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
            >
              <div className="flex gap-6">

                {/* Dummy Book Cover */}
                <div className="flex h-40 w-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-5xl text-white">
                  📚
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col">

                  <h2 className="text-2xl font-bold text-slate-900">
                    {c.book.title}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    ✍️ {c.book.author}
                  </p>

                  <p className="mt-4 text-sm text-slate-600 line-clamp-3">
                    {c.book.description}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-6">

                    <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
                      Qty: {c.quantity}
                    </span>

                    <span className="text-lg font-bold text-slate-900">
                      ₹ {c.book.price}
                    </span>

                    <span className="text-lg font-bold text-green-600">
                      Total: ₹ {c.quantity * c.book.price}
                    </span>
<button
    onClick={() => decreaseQuantity(c.id)}
    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-bold text-slate-700 transition hover:bg-slate-100"
  >
    -
  </button>
                  </div>

                </div>
              </div>
            </div>

          ))}

        </div>

        {/* Summary Card */}
        <div className="h-fit rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Order Summary
          </h2>

          <div className="mb-4 flex justify-between text-slate-600">
            <span>Total Items</span>
            <span>{cartitems.length}</span>
          </div>

          <div className="mb-6 h-px bg-slate-200"></div>

          <button onClick={handleProceed} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 font-semibold text-white transition hover:scale-[1.02]">
            Proceed to Checkout
          </button>

          <button  onClick={handleshopping} className="mt-4 w-full rounded-xl border border-slate-300 py-4 font-semibold text-slate-700 transition hover:bg-slate-100">
            Continue Shopping
          </button>

        </div>

      </div>
    </div>
  </div>
)


}