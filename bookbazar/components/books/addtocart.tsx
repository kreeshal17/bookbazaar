'use client'

import axios from "axios"
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export default function Addtocart({
  bookID,
  bookTitle,
  bookPrice,
}: {
  bookID: string;
  bookTitle: string;
  bookPrice: number;
})
{

    const router=useRouter()

async function handlecart() {
  try {
    const result = await axios.post("/api/cart/add", {
      bookID,
    });

    if (result.status === 201 || result.status === 200) {
      trackEvent("add_to_cart", {
        currency: "NPR",
        value: bookPrice,
        items: [
          {
            item_id: bookID,
            item_name: bookTitle,
            price: bookPrice,
            quantity: 1,
          },
        ],
      })
      alert("Successfully added to cart");
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      alert("Please login to use Add To Cart");
      return;
    }

    alert("please login to add to cart");
    router.push("/login")
  
    
    console.log(error);
  }
}


    return(
        <>
        
         <div className="flex flex-col gap-4 mb-8">
                <button onClick={handlecart} className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>

                {/* <button className="w-full py-4 px-6 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button> */}
              </div>
        
        </>
    )




}