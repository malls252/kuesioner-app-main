# Aplikasi Kuesioner FTI

Aplikasi kuesioner interaktif untuk rancang bangun website FTI. Pengguna umum dapat mengirim masukan secara publik, sementara Admin dapat login melalui Google OAuth untuk memantau data kuesioner pada Dashboard Admin.

## Konfigurasi Lingkungan (`.env`)

Sebelum menjalankan aplikasi, buatlah file `.env` di direktori root proyek dan isi dengan konfigurasi berikut:

```env
# URL koneksi database PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Google OAuth Credentials (diperoleh dari Google Cloud Console)
GOOGLE_CLIENT_ID="isi_client_id_google"
GOOGLE_CLIENT_SECRET="isi_client_secret_google"

# Secret untuk enkripsi session cookie (buat string acak yang aman)
# Anda bisa membuatnya menggunakan perintah: openssl rand -base64 32
AUTH_SECRET="isi_secret_aplikasi"

# URL dasar aplikasi (sesuaikan jika berjalan di port lain)
AUTH_URL="http://localhost:3000"

# Daftar email admin yang diizinkan masuk ke Dashboard (dipisahkan koma)
ADMIN_EMAILS="admin@gmail.com,dosen@gmail.com"
```

### Langkah Konfigurasi Google OAuth di Google Cloud Console:
1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada.
3. Buka menu **APIs & Services** > **OAuth consent screen**.
   - Pilih **External**.
   - Isi informasi aplikasi yang wajib (Nama Aplikasi, Email Dukungan, Kontak Developer).
   - Pada bagian **Scopes**, tambahkan scope: `.../auth/userinfo.email` dan `.../auth/userinfo.profile`.
4. Buka menu **Credentials** > **Create Credentials** > **OAuth client ID**.
   - Pilih Application Type: **Web application**.
   - Pada bagian **Authorized JavaScript origins**, tambahkan: `http://localhost:3000`
   - Pada bagian **Authorized redirect URIs**, tambahkan: `http://localhost:3000/api/auth/callback`
5. Salin **Client ID** dan **Client Secret** yang muncul lalu masukkan ke file `.env`.

---

## Cara Menjalankan Aplikasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi secara lokal:

### 1. Instal Dependensi
Jalankan perintah berikut untuk menginstal semua modul Node.js yang diperlukan:
```bash
npm install
```

### 2. Konfigurasi Database (Prisma)
Pastikan server database PostgreSQL Anda telah berjalan dan URL koneksi pada `DATABASE_URL` sudah benar. Kemudian sinkronisasikan skema database dan generate Prisma client:
```bash
# Sinkronisasi skema prisma dengan database
npx prisma db push

# Generate client prisma
npx prisma generate
```

### 3. Jalankan Server Pengembangan
Jalankan server lokal dalam mode development:
```bash
npm run dev
```

Server akan berjalan pada [http://localhost:3000](http://localhost:3000).

---

## Struktur Fitur Keamanan

1. **Akses Publik**: Pengguna umum dapat mengakses halaman utama `/` dan mengirim kuesioner via `/api/submit` tanpa login.
2. **Otentikasi Google**: Halaman login `/login` memfasilitasi integrasi Google Sign-In yang aman menggunakan protokol OAuth 2.0.
3. **Session Stateless**: Session disimpan menggunakan cookie terenkripsi (AES-256-GCM) di sisi client dengan opsi keamanan `HttpOnly`, `Secure`, dan `SameSite=Lax`.
4. **Proteksi Dashboard Admin**: Rute `/admin` diproteksi secara real-time via `proxy.ts`. Pengguna tanpa session akan langsung diarahkan kembali ke `/login`.
5. **Pembatasan Akses (Authorization)**: Hanya email yang terdaftar pada variabel lingkungan `ADMIN_EMAILS` yang dapat masuk ke Dashboard Admin. Email lainnya akan menampilkan halaman penolakan akses khusus (*Access Denied*).
6. **Proteksi API**: Endpoint `/api/admin/export`, `/api/admin/summary`, dan `/api/admin/submissions/[id]/file` diproteksi secara ketat. Mengembalikan status `401 Unauthorized` jika belum login, dan `403 Forbidden` jika email tidak terdaftar sebagai admin.

---

## Penjelasan Perubahan (Modifikasi yang Dilakukan)

Untuk mengimplementasikan sistem login, proteksi rute admin, dan pembatasan akses, berikut adalah perubahan utama yang telah dilakukan pada kode dasar aplikasi:

1. **Pembuatan File Konfigurasi Baru**:
   - **[.env.example](file:///.env.example)**: File template untuk variabel lingkungan (`.env`) agar memudahkan proses setup awal proyek.
   - **[proxy.ts](file:///proxy.ts)**: Menggantikan fungsi middleware tradisional di Next.js 16 untuk memproteksi dan mengarahkan rute `/admin` ke halaman login secara otomatis jika pengguna belum terotentikasi.

2. **Sistem Sesi & Keamanan**:
   - **[src/lib/session.ts](file:///src/lib/session.ts)**: Menambahkan modul kriptografi stateless menggunakan algoritma **AES-256-GCM** (bawaan Node.js `crypto`). Mengatur cookie sesi secara aman (`HttpOnly`, `SameSite=Lax`, dan `Secure` di produksi).

3. **Alur Otentikasi (Google OAuth 2.0)**:
   - **[app/api/auth/login/route.ts](file:///app/api/auth/login/route.ts)**: Membuat endpoint untuk memicu redirect ke Google Consent Screen dengan perlindungan CSRF token `state`.
   - **[app/api/auth/callback/route.ts](file:///app/api/auth/callback/route.ts)**: Membuat endpoint callback untuk menukarkan authorization code dengan profil Google pengguna, memvalidasi email, dan menyimpan sesi.
   - **[app/api/auth/logout/route.ts](file:///app/api/auth/logout/route.ts)**: Membuat endpoint untuk menghapus session cookie dari browser.

4. **Tampilan & Halaman Baru**:
   - **[app/login/page.tsx](file:///app/login/page.tsx)**: Membuat halaman Login baru dengan tombol Google Login yang berestetika tinggi dan menampilkan notifikasi kesalahan (error alert) jika autentikasi gagal.
   - **[app/admin/page.tsx](file:///app/admin/page.tsx)**: Memodifikasi halaman admin agar memvalidasi sesi secara dinamis. Jika pengguna yang masuk terdaftar di `ADMIN_EMAILS`, dashboard akan terbuka dengan detail profil admin di header. Jika tidak terdaftar, pengguna akan dialihkan ke tampilan khusus penolakan akses (*Access Denied*) lengkap dengan informasi akun mereka dan tombol logout.

5. **Pengamanan API Admin**:
   - Memodifikasi **[summary API](file:///app/api/admin/summary/route.ts)**, **[export API](file:///app/api/admin/export/route.ts)**, dan **[file API](file:///app/api/admin/submissions/[id]/file/route.ts)** agar mengecek sesi pengguna secara server-side. Mengembalikan status `401 Unauthorized` jika belum masuk, dan `403 Forbidden` jika emailnya tidak terdaftar sebagai admin.

6. **Kestabilan Pembangunan (Build)**:
   - **[src/lib/prisma.ts](file:///src/lib/prisma.ts)**: Menginisialisasi client database secara malas (*lazy loading* menggunakan Javascript Proxy). Hal ini mencegah kegagalan *next build* akibat pemanggilan awal koneksi ketika `DATABASE_URL` belum terisi.
   - **[prisma.config.ts](file:///prisma.config.ts)**: Memperbarui cara membaca variabel lingkungan agar menggunakan `process.env` agar kompatibel penuh dengan Prisma 7 tanpa menimbulkan error ketika salah satu variabel di-comment.

