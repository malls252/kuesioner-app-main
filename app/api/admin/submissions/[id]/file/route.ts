import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/session";

export const runtime = "nodejs";

function sanitizeFileName(name: string | null | undefined, fallback: string): string {
  if (!name) {
    return fallback;
  }

  return name.replace(/[\\/\n\r\t\"]/g, "_");
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/submissions/[id]/file">
) {
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
    const { id } = await context.params;
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind");

    if (kind !== "image" && kind !== "screenshot") {
      return Response.json({ message: "Parameter kind tidak valid" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        imageData: true,
        imageMimeType: true,
        imageName: true,
        screenshotData: true,
        screenshotMimeType: true,
        screenshotName: true,
      },
    });

    if (!submission) {
      return Response.json({ message: "Data tidak ditemukan" }, { status: 404 });
    }

    const data = kind === "image" ? submission.imageData : submission.screenshotData;
    const mimeType =
      (kind === "image" ? submission.imageMimeType : submission.screenshotMimeType) ||
      "application/octet-stream";
    const name = sanitizeFileName(
      kind === "image" ? submission.imageName : submission.screenshotName,
      `${kind}-${id}`
    );

    if (!data) {
      return Response.json({ message: "File tidak ditemukan" }, { status: 404 });
    }

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename=\"${name}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to get submission file:", error);
    return Response.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
