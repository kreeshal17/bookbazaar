'use client'

import axios from "axios"
import { useState } from "react"
import Link  from "next/link"
import { useRouter } from "next/navigation"
export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router= useRouter()
  async function handleForm(e:any) {
    e.preventDefault()

    const response = await axios.post("/api/auth/login", {
      email,
      password,
    })

    if(response.data.role=="ADMIN")
    {
      router.push("/admin")
    }
    console.log(response.data)
  

if (response.data.role === "SELLER") {

  if (response.data.hasStore) {
    router.push("/seller/dashboard")
  } else {
    router.push("/seller/onboard")
  }

}

if (response.data.role === "BUYER") {
  router.push("/buyer")
}
}

  return (
   <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b0b1a]">
  {/* Animated gradient blobs */}
  <div className="absolute -top-32 -left-32 w-96 h-96 bg-white-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />
  <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white-400 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse [animation-delay:2s]" />
  <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-white-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse [animation-delay:4s]" />

  {/* Grid overlay */}
  <div
    className="absolute inset-0 opacity-[0.07]"
    style={{
      backgroundImage:
        "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }}
  />

  {/* Glass card */}
  <div className="relative w-[400px] max-w-[92vw] p-[1px] rounded-2xl bg-gradient-to-br from-white/40 via-white/10 to-white/5 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.6)]">
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-10">
      {/* Logo orb */}
      <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 grid place-items-center shadow-lg shadow-indigo-500/40">
        <span className="text-white font-black text-xl">◆</span>
      </div>

      <h1 className="text-center text-2xl font-semibold text-white tracking-tight">
        Welcome back
      </h1>
      <p className="text-center text-sm text-white/50 mt-1 mb-8">
        Login in to continue to your dashboard
      </p>

      <form onSubmit={handleForm} className="space-y-5">
        {/* Email — floating label */}
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
            className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 pt-5 pb-2 text-white placeholder-transparent focus:outline-none focus:border-fuchsia-400/60 focus:bg-white/10 transition"
          />
          <label
            htmlFor="email"
            className="absolute left-4 top-2 text-xs text-white/60 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-fuchsia-300"
          >
            Email address
          </label>
        </div>

        {/* Password */}
        <div className="relative">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=" "
            className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 pt-5 pb-2 text-white placeholder-transparent focus:outline-none focus:border-cyan-400/60 focus:bg-white/10 transition"
          />
          <label
            htmlFor="password"
            className="absolute left-4 top-2 text-xs text-white/60 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-300"
          >
            Password
          </label>
        </div>

        <div className="flex items-center justify-between text-xs text-white/60">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-fuchsia-500" />
            Remember me
          </label>
          <a href="#" className="hover:text-white transition">Forgot password?</a>
        </div>

        <button
          type="submit"
          className="group relative w-full overflow-hidden rounded-xl p-[1px] bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400"
        >
          <span className="block rounded-[10px] bg-[#0b0b1a]/40 group-hover:bg-transparent transition py-3 text-white font-medium tracking-wide">
            Login 
          </span>
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] uppercase tracking-widest text-white/40">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition">
          Google
        </button>
        <button className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition">
          GitHub
        </button>
      </div>

      <p className="text-center text-xs text-white/50 mt-6">
        Don't have an account?{" "}
        <button>
            
        <Link href="/signup" className="text-white font-medium hover:text-fuchsia-300">Sign up</Link>
        </button>
      </p>
    </div>
  </div>
</div>

  )
}