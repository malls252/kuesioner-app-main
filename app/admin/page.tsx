import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import { getAdminSummary } from "@/src/lib/summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  // If not logged in, redirect to login page
  if (!session) {
    redirect("/login?error=unauthorized");
  }

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase()) || [];
  const isAdmin = adminEmails.includes(session.email.toLowerCase());

  // Render Access Denied view if not admin
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-100 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Akses Ditolak</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Akun Anda tidak memiliki akses sebagai admin.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex items-center gap-4 text-left">
            {session.picture ? (
              <img
                src={session.picture}
                alt={session.name}
                className="h-12 w-12 rounded-full border border-slate-200"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                {session.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {session.name}
              </p>
              <p className="truncate text-xs text-slate-500">{session.email}</p>
            </div>
          </div>

          <div className="grid gap-3 pt-2">
            <a
              href="/api/auth/logout"
              className="flex w-full items-center justify-center rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-[0.98] outline-none"
            >
              Logout
            </a>
            <a
              href="/"
              className="flex w-full items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98] outline-none"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </main>
    );
  }

  // User is admin, fetch summary and render dashboard
  const data = await getAdminSummary();

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {session.picture ? (
                <img
                  src={session.picture}
                  alt={session.name}
                  className="h-12 w-12 rounded-full border border-slate-200"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                  {session.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Dashboard Admin
                </h1>
                <p className="text-sm text-slate-600">
                  Masuk sebagai <strong>{session.name}</strong> ({session.email})
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Total pengirim masukan: <strong>{data.totalRespondents}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/api/admin/export"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 active:scale-[0.98]"
              >
                Download Hasil Kuesioner
              </a>
              <a
                href="/api/auth/logout"
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 active:scale-[0.98]"
              >
                Logout
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Masukan Terbaru
          </h2>

          <div className="space-y-4">
            {data.recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="font-semibold text-slate-900">{submission.name}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(submission.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                  {submission.feedback}
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Gambar
                    </p>
                    {submission.imageUrl ? (
                      <a href={submission.imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={submission.imageUrl}
                          alt="Lampiran gambar"
                          className="max-h-64 w-full rounded-lg border border-slate-200 object-contain"
                        />
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">Tidak ada gambar.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Screenshot
                    </p>
                    {submission.screenshotUrl ? (
                      <a
                        href={submission.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={submission.screenshotUrl}
                          alt="Lampiran screenshot"
                          className="max-h-64 w-full rounded-lg border border-slate-200 object-contain"
                        />
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">Tidak ada screenshot.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {data.recentSubmissions.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Belum ada masukan yang masuk.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
