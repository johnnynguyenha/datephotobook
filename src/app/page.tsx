"use client";

/* Johnny Nguyen - used AI to help style the basic log in page for demo purposes, will not reflect the actual product. there
is no functionality because this is for demo purposes only. typed it out manually.*/

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Logging in:", email, password);
    router.push("/sample");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-4 text-rose-600">
          Date Photobook
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Relive life's best moments. Save them.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 outline-none text-black"
          />

          <button
            type="submit"
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Log In
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <a href="/signup" className="text-rose-500 hover:underline font-medium">
            Sign up
          </a>
        </div>
      </div>
    </main>
  );
}