import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type ParsedUpload = {
  name: string;
  mimeType: string;
  data: Uint8Array<ArrayBuffer>;
} | null;

async function parseImageFile(value: FormDataEntryValue | null): Promise<ParsedUpload> {
  if (!value || typeof value === "string") {
    return null;
  }

  if (value.size === 0) {
    return null;
  }

  if (!value.type || !value.type.startsWith("image/")) {
    throw new Error("FILE_TYPE_INVALID");
  }

  if (value.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const arrayBuffer = await value.arrayBuffer();

  const bytes = new Uint8Array(
    arrayBuffer as ArrayBuffer
  ) as Uint8Array<ArrayBuffer>;

  return {
    name: value.name || "upload",
    mimeType: value.type,
    data: bytes,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const feedback = String(formData.get("feedback") ?? "").trim();

    if (!name) {
      return Response.json({ message: "Nama wajib diisi" }, { status: 400 });
    }

    if (!feedback) {
      return Response.json(
        { message: "Masukan/tulisan wajib diisi" },
        { status: 400 }
      );
    }

    const image = await parseImageFile(formData.get("image"));
    const screenshot = await parseImageFile(formData.get("screenshot"));

    const created = await prisma.submission.create({
      data: {
        name,
        feedback,
        imageName: image?.name,
        imageMimeType: image?.mimeType,
        imageData: image?.data,
        screenshotName: screenshot?.name,
        screenshotMimeType: screenshot?.mimeType,
        screenshotData: screenshot?.data,
      },
      select: {
        id: true,
        name: true,
        feedback: true,
        imageName: true,
        screenshotName: true,
        createdAt: true,
      },
    });

    return Response.json({
      message: "Masukan berhasil dikirim",
      data: created,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FILE_TYPE_INVALID") {
        return Response.json(
          { message: "File harus berupa gambar" },
          { status: 400 }
        );
      }

      if (error.message === "FILE_TOO_LARGE") {
        return Response.json(
          { message: "Ukuran file maksimal 5MB" },
          { status: 400 }
        );
      }
    }

    console.error("Failed to submit feedback:", error);
    return Response.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
