'use client'

import axios from "axios"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Onboard() {

const router = useRouter()

const [storename, setStorename] = useState("")
const [description, setDescription] = useState("")
const [loading, setLoading] = useState(false)

async function handleSubmit(e: any) {


e.preventDefault()

try {

  setLoading(true)

  const response = await axios.post(
    "/api/store/create",
    {
      storename,
      description
    }
  )

  alert(response.data.message)

  router.push("/seller/dashboard")

} catch (error: any) {

  alert(
    error?.response?.data?.message ||
    "Something went wrong"
  )

} finally {
  setLoading(false)



}
}

return ( <div className="min-h-screen bg-[#0f3460] flex items-center justify-center px-4">


  <div className="w-full max-w-md">

    <div className="bg-[#1a1a2e] border border-[#e94560]/20 rounded-xl shadow-lg p-8">

      <div className="mb-8 text-center">

        <h1 className="text-3xl font-bold text-[#eaeaea]">
          Create Your Store
        </h1>

        <p className="text-[#a8a8b3] mt-2">
          Start selling books on BookBazaar
        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        <div>
          <label className="block text-[#eaeaea] mb-2 text-sm">
            Store Name
          </label>

          <input
            type="text"
            value={storename}
            onChange={(e) =>
              setStorename(e.target.value)
            }
            placeholder="Krishal Book Hub"
            required
            className="w-full bg-[#16213e] border border-[#e94560]/30 text-[#eaeaea] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e94560]"
          />
        </div>

        <div>
          <label className="block text-[#eaeaea] mb-2 text-sm">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Tell buyers about your store..."
            rows={4}
            className="w-full bg-[#16213e] border border-[#e94560]/30 text-[#eaeaea] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e94560]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e94560] hover:bg-[#c73652] text-white rounded-lg px-6 py-3 font-semibold transition-all"
        >
          {loading
            ? "Creating Store..."
            : "Create Store"}
        </button>

      </form>

    </div>

  </div>

</div>


)}


