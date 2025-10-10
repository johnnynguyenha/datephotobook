"use client";

import DateGrid from "@/components/DateGrid";
import Link from "next/link";

export default function ProfilePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200 flex flex-col items-center py-10 px-4">
            <div className="bg-white/80 backdrop-blur-md shadow-lg p-6 w-full max-w-2xl text-center mb-6">
                <img
                    src="https://www.brides.com/thmb/GzU_cOYTERXr8IwZ7TIkVSN2484=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__brides__proteus__5b9bfab462fa261530d16531__11-d7d2c7078ecc4352a92c9cf7323f97eb.jpeg"
                    alt="Profile"
                    className="w-24 h-24 rounded-full mx-auto border-4 border-rose-300 shadow-md"
                />
                <h1 className="text-2xl font-bold text-rose-600 mt-3">
                    Justin and Hailey 💞
                </h1>
                <p className="text-gray-600 mt-1">"Keeping an eye out for Selener."</p>

                <div className="mt-4">
                    <Link
                        href="/create-date"
                        className="rounded-lg bg-rose-600 text-white px-5 py-2.5 font-semibold shadow hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                        + Add Date
                    </Link>
                </div>
            </div>
            <DateGrid />
        </main>
    );
}
