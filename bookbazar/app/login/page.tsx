'use client'

import axios from "axios"
import { useState } from "react"

export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleForm(e: React.FormEvent) {
    e.preventDefault()

    const response = await axios.post("/api/auth/login", {
      email,
      password,
    })

    console.log(response.data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-lg shadow-md w-96">

        <h1 className="text-2xl font-bold text-center mb-6">
          Login
        </h1>

        <form onSubmit={handleForm} className="space-y-4">

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  )
}