"use client";

/* Johnny Nguyen - used AI to help style the page. typed it out manually.*/

import DatesFromLocal from "./DatesFromLocal";

export default function ProfilePage() {
  const sampleDates = [
    {
      id: 1,
      title: "Beach Dinner",
      caption: "Dinner by the ocean! Yummy.",
      image:
        "https://as2.ftcdn.net/jpg/00/73/88/49/1000_F_73884907_3uxGgsKUKkPRku8rfwj30kyFsGV12Khv.jpg",
      rotate: "-rotate-3",
    },
    {
      id: 2,
      title: "Morning Coffee and Pastries",
      caption: "Tried a cute cafe, it was kinda mid but the shop looked good.",
      image:
        "https://2chicksandapenblog.com/wp-content/uploads/2022/01/screen-shot-2022-01-30-at-6.47.35-am.png?w=900",
      rotate: "rotate-2",
    },
    {
      id: 3,
      title: "Carnival Night",
      caption: "Almost puked. 10/10",
      image:
        "https://i.pinimg.com/736x/4e/7a/0d/4e7a0d43937c5853abe38e3e0eade73a.jpg",
      rotate: "-rotate-1",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-rose-200 flex flex-col items-center py-10 px-4">
      {/* header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg p-6 w-full max-w-2xl text-center mb-10">
        <img
          src="https://www.brides.com/thmb/GzU_cOYTERXr8IwZ7TIkVSN2484=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__brides__proteus__5b9bfab462fa261530d16531__11-d7d2c7078ecc4352a92c9cf7323f97eb.jpeg"
          alt="Profile"
          className="w-24 h-24 rounded-full mx-auto border-4 border-rose-300 shadow-md"
        />
        <h1 className="text-2xl font-bold text-rose-600 mt-3">
          Justin and Hailey 💞
        </h1>
        <p className="text-gray-600 mt-1">"Keeping an eye out for Selener."</p>
      </div>

      {/* ADDED (A3): render any dates saved in localStorage above the sample cards */}
      <DatesFromLocal />

      {/* grid polaroid style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {sampleDates.map((date) => (
          <a
            key={date.id}
            href={`/dates/${date.id}`}
            className={`group bg-white rounded-xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2 ${date.rotate} hover:rotate-0 p-4 flex flex-col items-center`}
          >
            {/* photo */}
            <div className="bg-white p-2 rounded-lg shadow-inner w-full">
              <img
                src={date.image}
                alt={date.title}
                className="w-full h-60 object-cover rounded-md"
              />
            </div>

            {/* caption */}
            <div className="mt-3 text-center">
              <h2 className="text-md font-semibold text-rose-600">
                {date.title}
              </h2>
              <p className="text-sm text-gray-600 italic">
                "{date.caption}"
              </p>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
