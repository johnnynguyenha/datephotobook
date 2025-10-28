export function isAuthed(): boolean {
    try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const userRaw = localStorage.getItem("user");
        return Boolean((token && userId) || userRaw);
    } catch {
        return false;
    }
}
