'use client'
import { useEffect, useState } from "react";
import axios from "axios";


interface book{
id:string
quantity:number
book:{
title:string
description:string
author:string
price:number
}
}
export default function checkout(){
const [fullName, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const[books,setBooks]= useState<book[]>([])

const handleSubmit=async (e:any)=>{
e.preventDefault()
 const response= await axios.post("/api/order/create",{
    fullName,
    phone,
    shippingAddr:address,
    city,
    state,
    postalCode
    



 })
 if(response.data)
 {
    alert("sucessfully submitted")
 }

}



useEffect(()=>{

const  fetch=async()=>{



    const response= await axios.get("api/cart/get")

    if(response.data)
    {
        setBooks(response.data)
    }





}
fetch()

},[])


const total= books.reduce( (sum,items)=>
    sum+items.quantity*items.book.price
,0



)



return (
  <div className="min-h-screen bg-slate-50 py-12">
    <div className="mx-auto max-w-7xl px-6 flex gap-10 items-start">

      {/* Shipping Form */}
      <div className="w-1/2 rounded-3xl bg-white p-8 shadow-lg border border-slate-100">

        <h2 className="mb-8 text-3xl font-bold text-slate-900">
          Shipping Information
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5  text-black"
        >

          <div className=" text-black">
            <label className="mb-2 block font-medium text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-slate-700">
              Phone Number
            </label>

            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-slate-700">
              Address
            </label>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-4">

            <div className="flex-1">
              <label className="mb-2 block font-medium text-slate-700">
                City
              </label>

              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1">
              <label className="mb-2 block font-medium text-slate-700">
                State
              </label>

              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

          </div>

          <div>
            <label className="mb-2 block font-medium text-slate-700">
              Postal Code
            </label>

            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 font-bold text-white shadow-lg transition hover:scale-[1.02]"
          >
            Place Order
          </button>

        </form>
      </div>

      {/* Order Summary */}
      <div className="w-1/2">

        <h1 className="mb-8 text-3xl font-bold text-slate-900">
          Order Summary
        </h1>

        <div className="space-y-6">

          {books.map((c) => (

            <div
              key={c.id}
              className="rounded-3xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-xl transition"
            >

              <div className="flex gap-6">

                <div className="flex h-40 w-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-5xl text-white">
                  📚
                </div>

                <div className="flex flex-1 flex-col">

                  <h2 className="text-2xl font-bold text-slate-900">
                    {c.book.title}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    ✍️ {c.book.author}
                  </p>

                  <p className="mt-4 text-sm text-slate-600">
                    {c.book.description}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-4">

                    <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
                      Qty: {c.quantity}
                    </span>

                    <span className="text-lg font-bold text-slate-900">
                      ₹ {c.book.price}
                    </span>

                    <span className="text-lg font-bold text-green-600">
                      Total: ₹ {c.quantity * c.book.price}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

        <div className="mt-8 rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border border-indigo-100">

          <div className="flex items-center justify-between">

            <span className="text-xl font-semibold text-slate-700">
              Grand Total
            </span>

            <span className="text-4xl font-bold text-indigo-600">
              ₹ {total}
            </span>

          </div>

        </div>

      </div>

    </div>
  </div>
)










}