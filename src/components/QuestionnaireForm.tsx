"use client";

import { FormEvent, useState } from "react";

export default function QuestionnaireForm() {
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Nama wajib diisi");
      return;
    }

    if (!feedback.trim()) {
      setMessage("Masukan/tulisan wajib diisi");
      return;
    }

    const form = event.currentTarget;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("feedback", feedback.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (screenshotFile) {
        formData.append("screenshot", screenshotFile);
      }

      const res = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        setMessage(data.message ?? "Gagal menyimpan");
        return;
      }

      setMessage("Terima kasih, masukan Anda berhasil dikirim");
      setName("");
      setFeedback("");
      setImageFile(null);
      setScreenshotFile(null);
      if (form) {
        form.reset();
      }
    } catch (error) {
      console.error("Submit failed:", error);
      setMessage("Terjadi kesalahan saat mengirim data");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Form Masukan Website FTI
        </h1>
        <p className="text-sm text-slate-600">
          Silakan isi nama, masukan bebas, serta lampiran gambar/screenshot
          untuk tindak lanjut hasil rancang bangun website FTI.
        </p>
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nama
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Masukkan nama"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="feedback"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Masukan / Tindak Lanjut
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Tuliskan masukan, catatan perbaikan, atau kebutuhan tindak lanjut..."
          rows={7}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="image"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Upload Gambar
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="screenshot"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Upload Screenshot
        </label>
        <input
          id="screenshot"
          type="file"
          accept="image/*"
          onChange={(event) =>
            setScreenshotFile(event.target.files?.[0] ?? null)
          }
          className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">Maksimal ukuran tiap file 5MB.</p>
      </div>

      {message && (
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : "Kirim Masukan"}
      </button>
    </form>
  );
}
