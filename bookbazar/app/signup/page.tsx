'use client'

import axios from "axios"
import { useState } from "react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleForm = (e) => {
    e.preventDefault();
    // your signup logic
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b1a] flex items-center justify-center px-4">
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-fuchsia-500 opacity-30 blur-3xl mix-blend-screen animate-pulse" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-cyan-400 opacity-25 blur-3xl mix-blend-screen animate-pulse [animation-delay:1s]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-indigo-500 opacity-30 blur-3xl mix-blend-screen animate-pulse [animation-delay:2s]" />
      </div>

      {/* Glass card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-br from-white/40 via-white/10 to-white/5 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-fuchsia-300 via-white to-cyan-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Create account
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Join us — it only takes a minute
          </p>
        </div>

        <form onSubmit={handleForm} className="space-y-5">
          {/* Name */}
          <div className="relative">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
              className="peer w-full rounded-xl border border-white/15 bg-white/5 px-4 pt-5 pb-2 text-white placeholder-transparent outline-none transition focus:border-fuchsia-400/60 focus:bg-white/10"
            />
            <label
              htmlFor="name"
              className="pointer-events-none absolute left-4 top-2 text-xs text-white/60 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-fuchsia-300"
            >
              Full name
            </label>
          </div>

          {/* Email */}
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="peer w-full rounded-xl border border-white/15 bg-white/5 px-4 pt-5 pb-2 text-white placeholder-transparent outline-none transition focus:border-fuchsia-400/60 focus:bg-white/10"
            />
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-4 top-2 text-xs text-white/60 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-fuchsia-300"
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
              className="peer w-full rounded-xl border border-white/15 bg-white/5 px-4 pt-5 pb-2 text-white placeholder-transparent outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
            />
            <label
              htmlFor="password"
              className="pointer-events-none absolute left-4 top-2 text-xs text-white/60 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-300"
            >
              Password
            </label>
          </div>

          {/* Confirm password */}
          <div className="relative">
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder=" "
              className="peer w-full rounded-xl border border-white/15 bg-white/5 px-4 pt-5 pb-2 text-white placeholder-transparent outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
            />
            <label
              htmlFor="confirm"
              className="pointer-events-none absolute left-4 top-2 text-xs text-white/60 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-300"
            >
              Confirm password
            </label>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 text-xs text-white/60">
            <input type="checkbox" required className="mt-0.5 accent-fuchsia-500" />
            <span>
              I agree to the{" "}
              <a href="#" className="text-fuchsia-300 hover:underline">Terms</a> and{" "}
              <a href="#" className="text-cyan-300 hover:underline">Privacy Policy</a>
            </span>
          </label>

          {/* CTA */}
          <button
            type="submit"
            className="group relative w-full overflow-hidden rounded-xl p-[1px]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400" />
            <span className="relative block rounded-[11px] bg-[#0b0b1a] px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-transparent">
              Create account
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3 text-xs text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          or sign up with
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10">
            Google
          </button>
          <button className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10">
            GitHub
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          Already have an account?{" "}
          <a href="#" className="font-medium text-fuchsia-300 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
