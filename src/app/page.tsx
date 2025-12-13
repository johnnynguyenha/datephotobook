import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
    const cookieStore = await cookies();
    const isAuthed = cookieStore.get("auth")?.value === "1";
    
    if (isAuthed) {
        redirect("/dashboard");
    } else {
        redirect("/login");
    }
}
