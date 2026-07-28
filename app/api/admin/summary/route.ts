import { getSession } from "@/src/lib/session";
import { getAdminSummary } from "@/src/lib/summary";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const adminEmails = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase()) || [];
  const isAdmin = adminEmails.includes(session.email.toLowerCase());

  if (!isAdmin) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await getAdminSummary();
    return Response.json(data);
  } catch (error) {
    console.error("Failed to fetch admin summary:", error);
    return Response.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
