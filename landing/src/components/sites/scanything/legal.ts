import type { Lang } from "./content";

/** Operator details used throughout the legal pages. */
export const LEGAL = {
  /** Registered company (the legal entity). */
  entity: "PT. Bantu Indonesia Technology",
  /** Company brand that Scanything sits under. */
  brand: "Zieara Technology",
  email: "hello@scanything.online",
  country: "Indonesia",
  address: "Omah Dongeng Kalasan, Somodaran, Purwomartani, Kalasan, Sleman, Daerah Istimewa Yogyakarta, Indonesia",
} as const;

/** A plain string is a paragraph, a string array is a bullet list. Inline links use [label](/path). */
export type LegalBlock = string | string[];
export type LegalSection = { heading: string; body: LegalBlock[]; highlight?: boolean };
export type LegalDoc = { title: string; intro: string[]; sections: LegalSection[] };
export type LegalKind = "privacy" | "terms";

export type LegalUi = {
  eyebrow: string;
  updatedLabel: string;
  updatedDate: string;
  contents: string;
  seeAlso: string;
  backHome: string;
  docs: Record<LegalKind, string>;
};

const { entity, brand, email, address } = LEGAL;
/** "Zieara Technology (PT. Bantu Indonesia Technology)" */
const operator = `${brand} (${entity})`;

/* ------------------------------------------------------------------ */
/* Indonesian                                                          */
/* ------------------------------------------------------------------ */

const uiId: LegalUi = {
  eyebrow: "Legal",
  updatedLabel: "Terakhir diperbarui",
  updatedDate: "15 Oktober 2026",
  contents: "Isi",
  seeAlso: "Baca juga",
  backHome: "Kembali ke beranda",
  docs: { privacy: "Kebijakan Privasi", terms: "Syarat dan Ketentuan" },
};

const privacyId: LegalDoc = {
  title: "Kebijakan Privasi",
  intro: [
    `Kebijakan ini menjelaskan data pribadi apa yang dikumpulkan ${operator} ("kami") saat kamu memakai Scanything, untuk apa data itu dipakai, siapa yang membantu kami memprosesnya, dan pilihan yang kamu punya. Kami menulisnya dengan bahasa sederhana. Kalau ada yang kurang jelas, kirim email ke ${email}.`,
  ],
  sections: [
    {
      heading: "Versi singkat",
      highlight: true,
      body: [
        [
          "Kami mengumpulkan yang dibutuhkan agar app berjalan: akunmu, profil kesehatan yang kamu isi, foto yang kamu ambil, dan jurnalmu.",
          "Data itu dipakai untuk memberi analisis dan rencana yang sesuai untukmu. Kami tidak menjual data pribadimu dan tidak melacakmu untuk iklan.",
          "Merek tidak bisa membayar untuk mengubah skor.",
          "Kamu bisa menghapus catatan satu per satu atau seluruh akunmu di app kapan saja.",
        ],
      ],
    },
    {
      heading: "Siapa kami",
      body: [
        `Scanything adalah produk ${brand}, yang berada di bawah ${entity}, perseroan terbatas yang didirikan berdasarkan hukum Republik Indonesia. Layanan ini mencakup web app di app.scanything.online serta app Android dan iOS kami (bersama-sama disebut "Scanything" atau "layanan").`,
        `Kantor pusat: ${address}.`,
        `${entity} bertanggung jawab atas data pribadimu berdasarkan kebijakan ini, sebagai pengendali data pribadi.`,
      ],
    },
    {
      heading: "Apa yang dilakukan layanan ini",
      body: [
        "Scanything memindai label makanan dan skincare dari foto, menganalisis kulit dari selfie, mencatat makanan dari foto, menyimpan jurnal kulit, menyusun rencana personal dari kuis singkat, dan menampilkan pola dari waktu ke waktu. Premium adalah langganan berbayar yang opsional.",
      ],
    },
    {
      heading: "Data yang kami kumpulkan",
      body: [
        "Kami hanya mengumpulkan data yang kamu berikan atau yang dibutuhkan agar layanan berjalan:",
        [
          "Data akun: email, nama, dan cara kamu masuk (email dan kata sandi, Google, atau Apple).",
          "Profil kesehatan yang kamu isi: kondisi seperti hamil, alergi, keluhan, tujuan kulit, daftar hindari, dan jawaban kuis.",
          "Foto yang kamu ambil: label produk, makanan, dan selfie untuk cek kulit.",
          "Hasil dari app: hasil scan, hasil cek kulit, catatan jurnal (suasana hati, tidur, air minum, stres, tag, catatan, makanan), dan rutinitasmu.",
          "Status pembelian: apakah kamu punya Premium atau masa coba, yang kami terima dari App Store atau Google Play melalui RevenueCat. Pembayaran diproses oleh Apple atau Google, jadi kami tidak melihat data kartumu.",
          "Data teknis dasar yang dibutuhkan untuk menjalankan layanan: jenis perangkat, versi app, dan log.",
        ],
      ],
    },
    {
      heading: "Data kesehatan",
      body: [
        "Profil kesehatan, hasil cek kulit, dan jurnalmu bisa menggambarkan kondisi kesehatanmu. Menurut hukum Indonesia, data kesehatan termasuk data pribadi yang bersifat spesifik dan perlu perlindungan lebih.",
        "Kamu yang memilih apa yang diisi. Kami memprosesnya hanya untuk menjalankan fitur yang kamu pakai, berdasarkan persetujuanmu. Kamu bisa mengubah atau menghapusnya kapan saja, dan itu juga berarti menarik persetujuan untuk data tersebut.",
        "Beberapa fitur bekerja lebih baik dengan detail yang lebih lengkap. Misalnya, menandai hamil membuat penilaian lebih ketat untuk bahan tertentu. Mengosongkan kolom selalu boleh.",
      ],
    },
    {
      heading: "Cara kami memakai datamu",
      body: [
        "Kami memakai datamu untuk:",
        [
          "Memberi analisis dan personalisasi: skor, cek kulit, rencana, dan pola.",
          "Menyinkronkan datamu di semua perangkatmu.",
          "Menjaga layanan tetap andal, termasuk menemukan dan memperbaiki error.",
          "Memproses langganan.",
          "Menjawab pertanyaan dan permintaan bantuan.",
        ],
        "Kami tidak:",
        [
          "Menjual data pribadimu.",
          "Memakai datamu untuk pelacakan iklan.",
          "Mengizinkan merek membayar untuk mengubah skor.",
        ],
      ],
    },
    {
      heading: "Foto",
      body: [
        [
          "Foto lengkap dikirim untuk dianalisis. Praktik kami adalah tidak menyimpan foto lengkap lebih lama dari yang dibutuhkan untuk mengembalikan hasilnya.",
          "Thumbnail kecil disimpan di perangkatmu dan di akunmu agar bisa tampil di jurnal.",
          "Thumbnail selfie disimpan di penyimpanan privat yang hanya bisa diakses akunmu.",
        ],
      ],
    },
    {
      heading: "Dengan siapa data dibagikan",
      body: [
        "Kami memakai beberapa penyedia layanan untuk menjalankan Scanything. Mereka memproses data atas nama kami dan hanya untuk keperluan berikut:",
        [
          "Supabase: database, autentikasi (masuk akun), dan penyimpanan foto privat.",
          "Vercel: hosting dan fungsi server.",
          "Penyedia model AI, diakses melalui Sumopod: menerima foto dan konteks profil yang relevan (misalnya tujuan kulit atau daftar hindarimu) untuk dianalisis. Data ini dikirim hanya untuk analisis dan tidak kami pakai untuk iklan.",
          "RevenueCat, Apple, dan Google: langganan dan status pembelian.",
          "Google dan Apple: masuk akun, jika kamu memilih cara itu.",
        ],
        "Kami hanya membagikan yang dibutuhkan masing-masing penyedia. Kami juga bisa mengungkapkan data jika diwajibkan oleh hukum.",
      ],
    },
    {
      heading: "Data di luar Indonesia",
      body: [
        "Sebagian penyedia di atas memakai server di luar Indonesia, jadi datamu bisa diproses di negara lain. Kami hanya mengirim yang dibutuhkan setiap penyedia, dan kami melindungi transfer tersebut sesuai ketentuan hukum Indonesia.",
      ],
    },
    {
      heading: "Tautan belanja",
      body: [
        "Sebagian tautan belanja di Scanything adalah tautan afiliasi, dan selalu kami beri label. Kami bisa mendapat komisi jika kamu membeli lewat tautan itu, tapi ini tidak memengaruhi skor.",
        "Saat kamu membuka tautan belanja, kamu pindah ke toko pihak ketiga yang punya kebijakan privasinya sendiri.",
      ],
    },
    {
      heading: "Penyimpanan dan penghapusan data",
      body: [
        [
          "Datamu disimpan selama akunmu ada.",
          "Kamu bisa menghapus scan, foto, dan catatan jurnal satu per satu kapan saja.",
          "Kamu bisa menghapus seluruh akun di app lewat Profil > Hapus akun. Ini menghapus data akun, scan, jurnal, pengaturan, dan foto yang tersimpan.",
          "Salinan cadangan (backup) bisa butuh waktu hingga 30 hari untuk ikut terhapus.",
          `Kamu juga bisa meminta penghapusan lewat email ke ${email}.`,
        ],
      ],
    },
    {
      heading: "Hak kamu",
      body: [
        "Berdasarkan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), kamu berhak untuk:",
        [
          "Mengakses data pribadimu.",
          "Memperbaiki data yang salah atau tidak lengkap.",
          "Menghapus data pribadimu.",
          "Menarik persetujuan yang pernah kamu berikan.",
        ],
        "Jika kamu tinggal di Uni Eropa atau Inggris, kamu punya hak serupa berdasarkan GDPR jika berlaku.",
        `Sebagian besar hak ini bisa kamu jalankan sendiri di app. Untuk hal lain, kirim email ke ${email}. Kami akan membalas secepatnya dan dalam batas waktu yang diatur hukum. Kami mungkin meminta konfirmasi bahwa permintaan itu memang darimu.`,
      ],
    },
    {
      heading: "Anak-anak",
      body: [
        "Scanything tidak ditujukan untuk anak di bawah 13 tahun, atau di bawah usia minimum di negaramu jika lebih tinggi. Jika usiamu di bawah 18 tahun, kamu perlu izin orang tua atau wali untuk memakainya.",
        "Jika kamu tahu ada anak yang memberikan data kepada kami tanpa izin tersebut, kirim email kepada kami dan kami akan menghapusnya.",
      ],
    },
    {
      heading: "Perubahan kebijakan ini",
      body: [
        "Jika kebijakan ini berubah, kami akan memperbarui tanggal di bagian atas halaman ini. Untuk perubahan penting, kami juga akan memberi tahu kamu di app.",
      ],
    },
    {
      heading: "Kontak",
      body: [`Pertanyaan, permintaan, atau keluhan tentang datamu: ${email}.`, `${operator}. Kantor pusat: ${address}.`],
    },
  ],
};

const termsId: LegalDoc = {
  title: "Syarat dan Ketentuan",
  intro: [
    `Syarat ini adalah perjanjian antara kamu dan ${entity} (${brand}, "kami") untuk memakai Scanything: web app di app.scanything.online serta app Android dan iOS kami. Dengan membuat akun atau memakai layanan, kamu menyetujuinya. Mohon baca dengan saksama, terutama bagian kesehatan.`,
  ],
  sections: [
    {
      heading: "Informasi kesehatan, bukan nasihat medis",
      highlight: true,
      body: [
        "Scanything memberi informasi kesehatan umum. Ini bukan nasihat medis, bukan alat kesehatan, dan tidak mendiagnosis, mengobati, atau mencegah penyakit apa pun.",
        "Skor, cek kulit, rencana, dan pola dibuat dengan AI dan bisa salah. Foto bisa terbaca keliru, dan label bisa tidak lengkap atau sudah usang.",
        [
          "Selalu baca label asli pada produk sebelum dimakan atau dipakai.",
          "Jika kamu hamil, menyusui, atau punya alergi, periksa sendiri bahannya setiap kali. Jangan hanya mengandalkan Scanything.",
          "Untuk masalah medis atau kulit, temui dokter atau dokter kulit. Jangan menunda atau melewatkan perawatan profesional karena sesuatu yang kamu lihat di app.",
          "Pola berasal dari catatanmu sendiri dan menunjukkan keterkaitan, bukan penyebab atau diagnosis.",
        ],
      ],
    },
    {
      heading: "Siapa yang boleh memakai Scanything",
      body: [
        "Kamu harus berusia minimal 13 tahun, atau usia minimum di negaramu jika lebih tinggi. Jika usiamu di bawah 18 tahun, kamu perlu izin orang tua atau wali, dan mereka ikut menyetujui syarat ini.",
      ],
    },
    {
      heading: "Akunmu",
      body: [
        "Kamu bisa mendaftar dengan email dan kata sandi, Google, atau Apple. Kamu setuju untuk:",
        [
          "Memberikan informasi yang benar.",
          "Menjaga kata sandi dan tidak membagikan akunmu.",
          "Bertanggung jawab atas aktivitas di akunmu.",
          `Segera memberi tahu kami di ${email} jika kamu curiga ada orang lain yang mengakses akunmu.`,
        ],
      ],
    },
    {
      heading: "Penggunaan yang diperbolehkan",
      body: [
        "Saat memakai Scanything, jangan:",
        [
          "Melanggar hukum atau hak orang lain.",
          "Mengunggah foto orang lain tanpa izin mereka. Cek kulit ditujukan untuk wajahmu sendiri.",
          "Mencoba mengakses akun orang lain atau sistem kami tanpa izin, atau mengganggu layanan.",
          "Mengambil data, menyalin, atau menjual ulang layanan atau hasilnya dalam jumlah besar, termasuk dengan bot atau alat otomatis.",
          "Membongkar (reverse engineer) app, kecuali sejauh diizinkan hukum.",
        ],
      ],
    },
    {
      heading: "Kontenmu",
      body: [
        "Foto, catatan, dan isian jurnalmu tetap milikmu. Kamu memberi kami izin untuk menyimpan dan memprosesnya hanya untuk menjalankan layanan bagimu, seperti dijelaskan di [Kebijakan Privasi](/privacy) kami.",
        "Kamu bisa menghapus kontenmu kapan saja.",
      ],
    },
    {
      heading: "Premium, masa coba gratis, dan pembayaran",
      body: [
        "Scanything punya paket gratis dan langganan Premium yang opsional. Harga ditampilkan di app sebelum kamu membeli.",
        [
          "Masa coba gratis: pelanggan baru bisa mendapat masa coba gratis. Jika tidak dibatalkan sebelum berakhir, masa coba berubah menjadi langganan berbayar.",
          "Perpanjangan otomatis: langganan diperpanjang otomatis di akhir setiap periode sampai kamu membatalkannya. Tagihan dan perpanjangan diurus oleh App Store atau Google Play.",
          "Pembatalan: batalkan kapan saja di pengaturan langganan App Store atau Google Play. Menghapus app atau akunmu tidak otomatis membatalkan langganan di toko.",
          "Web app: pembayaran di web app saat ini berjalan dalam mode uji dan tidak ada biaya yang ditagih. Jika ini berubah, kami akan memperbarui syarat ini.",
        ],
      ],
    },
    {
      heading: "Pengembalian dana",
      body: [
        "Pembelian melalui App Store atau Google Play mengikuti kebijakan pengembalian dana toko tersebut. Permintaan pengembalian dana diproses oleh Apple atau Google sesuai aturan mereka.",
        "Tidak ada bagian dari syarat ini yang membatasi hak pengembalian dana yang kamu miliki menurut hukum.",
      ],
    },
    {
      heading: "Tautan belanja dan pihak ketiga",
      body: [
        [
          "Sebagian tautan belanja adalah tautan afiliasi dan selalu diberi label. Kami bisa mendapat komisi, tapi ini tidak memengaruhi skor. Merek tidak bisa membayar untuk mengubah skor.",
          "Toko pihak ketiga punya syarat dan kebijakan privasinya sendiri. Kami tidak bertanggung jawab atas produk, harga, atau layanan mereka.",
          "Masuk dengan Google atau Apple serta pembayaran lewat toko juga tunduk pada syarat dari penyedia tersebut.",
        ],
      ],
    },
    {
      heading: "Hak kekayaan intelektual",
      body: [
        `App Scanything, nama, logo, desain, teks, dan perangkat lunaknya adalah milik ${entity} atau pemberi lisensinya. Kami memberimu hak pribadi yang tidak dapat dialihkan untuk memakai layanan bagi keperluan pribadi dan nonkomersial sesuai syarat ini.`,
      ],
    },
    {
      heading: "Perubahan layanan",
      body: [
        "Kami terus mengembangkan Scanything, jadi fitur bisa ditambah, diubah, atau dihapus. Kami berusaha menjaga layanan tetap tersedia, tapi tidak bisa menjamin layanan selalu tanpa gangguan atau bebas error.",
      ],
    },
    {
      heading: "Batasan tanggung jawab",
      body: [
        `Scanything disediakan "sebagaimana adanya" dan "sebagaimana tersedia". Sejauh diizinkan hukum:`,
        [
          "Kami tidak menjamin hasil selalu akurat, lengkap, atau sesuai dengan kondisimu.",
          "Kami tidak bertanggung jawab atas kerugian tidak langsung, atau atas akibat dari mengandalkan app tanpa membaca label atau meminta saran profesional.",
          "Total tanggung jawab kami kepadamu atas klaim apa pun terkait layanan dibatasi sebesar jumlah yang kamu bayar untuk Scanything dalam 12 bulan sebelum klaim.",
          "Tidak ada bagian dari syarat ini yang menghapus tanggung jawab yang menurut hukum tidak boleh dihapus.",
        ],
      ],
    },
    {
      heading: "Berhenti memakai layanan",
      body: [
        [
          "Kamu bisa berhenti memakai Scanything dan menghapus akunmu kapan saja di app (Profil > Hapus akun).",
          "Kami bisa menangguhkan atau menutup akun yang melanggar syarat ini atau hukum, atau yang membahayakan pengguna lain atau layanan. Jika wajar, kami akan memberi tahu kamu lebih dulu.",
          "Saat akun ditutup, datamu dihapus seperti dijelaskan di [Kebijakan Privasi](/privacy).",
        ],
      ],
    },
    {
      heading: "Perubahan syarat ini",
      body: [
        "Jika syarat ini berubah, kami akan memperbarui tanggal di bagian atas halaman ini. Untuk perubahan penting, kami juga akan memberi tahu kamu di app. Jika kamu tetap memakai Scanything setelah perubahan berlaku, berarti kamu menyetujui syarat yang baru.",
      ],
    },
    {
      heading: "Hukum yang berlaku",
      body: [
        "Syarat ini diatur oleh hukum Republik Indonesia. Jika ada perselisihan, kami akan lebih dulu mencoba menyelesaikannya bersamamu secara musyawarah.",
        "Jika tidak berhasil, perselisihan diselesaikan di pengadilan di Indonesia, tanpa mengurangi hak yang kamu miliki menurut hukum perlindungan konsumen di negara tempat tinggalmu.",
      ],
    },
    {
      heading: "Kontak",
      body: [`Pertanyaan tentang syarat ini: ${email}.`, `${operator}. Kantor pusat: ${address}.`],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* English                                                             */
/* ------------------------------------------------------------------ */

const uiEn: LegalUi = {
  eyebrow: "Legal",
  updatedLabel: "Last updated",
  updatedDate: "15 October 2026",
  contents: "Contents",
  seeAlso: "Read next",
  backHome: "Back to home",
  docs: { privacy: "Privacy Policy", terms: "Terms of Service" },
};

const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  intro: [
    `This policy explains what personal data ${operator} ("we") collects when you use Scanything, why we use it, who helps us process it and the choices you have. We wrote it in plain language. If anything is unclear, email us at ${email}.`,
  ],
  sections: [
    {
      heading: "The short version",
      highlight: true,
      body: [
        [
          "We collect what the app needs to work: your account, the health profile you enter, the photos you take and your diary.",
          "We use it to give you analysis and a plan that fits you. We do not sell your personal data and we do not track you for ads.",
          "Brands cannot pay to change a score.",
          "You can delete single entries or your whole account in the app at any time.",
        ],
      ],
    },
    {
      heading: "Who we are",
      body: [
        `Scanything is a product of ${brand}, which sits under ${entity}, a limited liability company established under the laws of the Republic of Indonesia. The service includes the web app at app.scanything.online and our Android and iOS apps (together, "Scanything" or "the service").`,
        `Head office: ${address}.`,
        `${entity} is responsible for your personal data under this policy, as the data controller.`,
      ],
    },
    {
      heading: "What the service does",
      body: [
        "Scanything scans food and skincare labels from photos, analyzes your skin from selfies, logs meals from photos, keeps a skin diary, builds a personal plan from a short quiz and shows patterns over time. Premium is an optional paid subscription.",
      ],
    },
    {
      heading: "Data we collect",
      body: [
        "We only collect data you give us or that the service needs to run:",
        [
          "Account data: your email, name and how you sign in (email and password, Google or Apple).",
          "Health profile you choose to enter: conditions such as pregnancy, allergies, symptoms, skin goals, your avoid list and your quiz answers.",
          "Photos you take: product labels, meals and selfies for skin checks.",
          "What the app creates for you: scan results, skin check results, diary entries (mood, sleep, water, stress, tags, notes, meals) and your routine.",
          "Purchase status: whether you have Premium or a trial, which we receive from the App Store or Google Play through RevenueCat. Payments are handled by Apple or Google, so we never see your card details.",
          "Basic technical data needed to run the service: device type, app version and logs.",
        ],
      ],
    },
    {
      heading: "Health data",
      body: [
        "Your health profile, skin check results and diary can say something about your health. Under Indonesian law, health data is a specific type of personal data that needs extra care.",
        "You choose what to enter. We process it only to run the features you use, based on your consent. You can change or delete it at any time, which also withdraws your consent for that data.",
        "Some features work better with more detail. For example, marking pregnancy makes scores stricter on certain ingredients. Leaving a field empty is always fine.",
      ],
    },
    {
      heading: "How we use your data",
      body: [
        "We use your data to:",
        [
          "Give you analysis and personalization: scores, skin checks, your plan and patterns.",
          "Sync your data across your devices.",
          "Keep the service reliable, including finding and fixing errors.",
          "Process subscriptions.",
          "Answer questions and support requests.",
        ],
        "We do not:",
        [
          "Sell your personal data.",
          "Use your data for ad tracking.",
          "Let brands pay to change a score.",
        ],
      ],
    },
    {
      heading: "Photos",
      body: [
        [
          "Full photos are sent for analysis. Our practice is not to keep the full photo longer than needed to return your result.",
          "A small thumbnail is kept on your device and in your account so it can appear in your diary.",
          "Selfie thumbnails are stored in private storage that only your account can access.",
        ],
      ],
    },
    {
      heading: "Who we share data with",
      body: [
        "We use a small number of service providers to run Scanything. They process data on our behalf and only for these purposes:",
        [
          "Supabase: database, sign in and private photo storage.",
          "Vercel: hosting and server functions.",
          "An AI model provider, accessed through Sumopod: receives your photos and relevant profile context (for example your skin goals or avoid list) for analysis. We send this only for analysis and do not use it for advertising.",
          "RevenueCat, Apple and Google: subscriptions and purchase status.",
          "Google and Apple: sign in, if you choose it.",
        ],
        "We share only what each provider needs. We may also disclose data when the law requires it.",
      ],
    },
    {
      heading: "Data outside Indonesia",
      body: [
        "Some of these providers run servers outside Indonesia, so your data may be processed in other countries. We only send what each provider needs, and we protect these transfers as Indonesian law requires.",
      ],
    },
    {
      heading: "Shop links",
      body: [
        "Some shop links in Scanything are affiliate links, and we always label them. We may earn a commission if you buy through one, but this never affects a score.",
        "When you open a shop link, you leave Scanything for a third party store that has its own privacy policy.",
      ],
    },
    {
      heading: "How long we keep data and how to delete it",
      body: [
        [
          "We keep your data while your account exists.",
          "You can delete single scans, photos and diary entries at any time.",
          "You can delete your whole account in the app under Profile > Delete account. This removes your account data, scans, diary, settings and stored photos.",
          "Backups can take up to 30 days to clear.",
          `You can also ask us to delete your data by emailing ${email}.`,
        ],
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Under Indonesia's Personal Data Protection Law (UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi), you have the right to:",
        [
          "Access your personal data.",
          "Correct data that is wrong or incomplete.",
          "Delete your personal data.",
          "Withdraw consent you have given.",
        ],
        "If you live in the European Union or the United Kingdom, you have similar rights under the GDPR where it applies.",
        `You can do most of this yourself in the app. For anything else, email ${email}. We will reply as soon as we can and within the time the law requires. We may ask you to confirm that the request comes from you.`,
      ],
    },
    {
      heading: "Children",
      body: [
        "Scanything is not meant for children under 13, or under the minimum age in your country if it is higher. If you are under 18, you need permission from a parent or guardian to use it.",
        "If you believe a child has given us data without that permission, email us and we will delete it.",
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "If we change this policy, we will update the date at the top of this page. For important changes, we will also let you know in the app.",
      ],
    },
    {
      heading: "Contact",
      body: [`Questions, requests or complaints about your data: ${email}.`, `${operator}. Head office: ${address}.`],
    },
  ],
};

const termsEn: LegalDoc = {
  title: "Terms of Service",
  intro: [
    `These terms are the agreement between you and ${entity} (${brand}, "we") for using Scanything: the web app at app.scanything.online and our Android and iOS apps. By creating an account or using the service, you agree to them. Please read them carefully, especially the health section.`,
  ],
  sections: [
    {
      heading: "Health information, not medical advice",
      highlight: true,
      body: [
        "Scanything gives general wellness information. It is not medical advice, it is not a medical device and it does not diagnose, treat or prevent any condition.",
        "Scores, skin checks, plans and patterns are made with AI and can be wrong. A photo can be read incorrectly, and a label can be incomplete or out of date.",
        [
          "Always read the actual label on the product before you eat or use it.",
          "If you are pregnant, breastfeeding or have allergies, check the ingredients yourself every time. Do not rely on Scanything alone.",
          "For any medical or skin concern, see a doctor or dermatologist. Do not delay or skip professional care because of something you saw in the app.",
          "Patterns come from your own logs and show links, not causes or a diagnosis.",
        ],
      ],
    },
    {
      heading: "Who can use Scanything",
      body: [
        "You must be at least 13, or the minimum age in your country if it is higher. If you are under 18, you need permission from a parent or guardian, and they also agree to these terms.",
      ],
    },
    {
      heading: "Your account",
      body: [
        "You can sign up with email and password, Google or Apple. You agree to:",
        [
          "Give accurate information.",
          "Keep your password safe and not share your account.",
          "Take responsibility for activity in your account.",
          `Tell us at ${email} straight away if you think someone else has accessed your account.`,
        ],
      ],
    },
    {
      heading: "Acceptable use",
      body: [
        "When you use Scanything, please do not:",
        [
          "Break the law or anyone else's rights.",
          "Upload photos of other people without their permission. Skin checks are meant for your own face.",
          "Try to access other people's accounts or our systems without permission, or disrupt the service.",
          "Scrape, copy or resell the service or its results at scale, including with bots or automated tools.",
          "Reverse engineer the app, except where the law allows it.",
        ],
      ],
    },
    {
      heading: "Your content",
      body: [
        "Your photos, notes and diary entries stay yours. You give us permission to store and process them only to run the service for you, as described in our [Privacy Policy](/privacy).",
        "You can delete your content at any time.",
      ],
    },
    {
      heading: "Premium, free trial and payments",
      body: [
        "Scanything has a free plan and an optional Premium subscription. Prices are shown in the app before you buy.",
        [
          "Free trial: new subscribers may get a free trial. If you do not cancel before it ends, it becomes a paid subscription.",
          "Auto renewal: subscriptions renew automatically at the end of each period until you cancel. Billing and renewal are handled by the App Store or Google Play.",
          "Cancelling: cancel any time in your App Store or Google Play subscription settings. Deleting the app or your account does not cancel a store subscription by itself.",
          "Web app: payments in the web app currently run in test mode and nothing is charged. If that changes, we will update these terms.",
        ],
      ],
    },
    {
      heading: "Refunds",
      body: [
        "Purchases through the App Store or Google Play follow that store's refund policy. Refund requests are handled by Apple or Google under their rules.",
        "Nothing in these terms limits any refund rights you have under the law.",
      ],
    },
    {
      heading: "Shop links and third parties",
      body: [
        [
          "Some shop links are affiliate links and are always labelled. We may earn a commission, but it never affects a score. Brands cannot pay to change a score.",
          "Third party stores have their own terms and privacy policies. We are not responsible for their products, prices or service.",
          "Signing in with Google or Apple and paying through a store are also covered by those providers' terms.",
        ],
      ],
    },
    {
      heading: "Intellectual property",
      body: [
        `The Scanything app, name, logo, design, text and software belong to ${entity} or its licensors. We give you a personal, non transferable right to use the service for your own non commercial use under these terms.`,
      ],
    },
    {
      heading: "Changes to the service",
      body: [
        "We keep improving Scanything, so features may be added, changed or removed. We work to keep the service available, but we cannot promise it will always be uninterrupted or error free.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        `Scanything is provided "as is" and "as available". To the extent the law allows:`,
        [
          "We do not guarantee that results are always accurate, complete or suitable for your situation.",
          "We are not liable for indirect loss, or for the consequences of relying on the app instead of reading the label or getting professional advice.",
          "Our total liability to you for any claim related to the service is limited to the amount you paid for Scanything in the 12 months before the claim.",
          "Nothing in these terms excludes liability that cannot be excluded under the law.",
        ],
      ],
    },
    {
      heading: "Ending your use",
      body: [
        [
          "You can stop using Scanything and delete your account at any time in the app (Profile > Delete account).",
          "We may suspend or close an account that breaks these terms or the law, or that puts other users or the service at risk. Where reasonable, we will tell you first.",
          "When an account is closed, your data is deleted as described in our [Privacy Policy](/privacy).",
        ],
      ],
    },
    {
      heading: "Changes to these terms",
      body: [
        "If we change these terms, we will update the date at the top of this page. For important changes, we will also let you know in the app. If you keep using Scanything after a change takes effect, you accept the new terms.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These terms are governed by the laws of the Republic of Indonesia. If there is a dispute, we will first try to resolve it with you informally.",
        "If that does not work, disputes will be settled in the courts of Indonesia, without limiting any rights you have under the consumer protection law of the country where you live.",
      ],
    },
    {
      heading: "Contact",
      body: [`Questions about these terms: ${email}.`, `${operator}. Head office: ${address}.`],
    },
  ],
};

export const LEGAL_COPY: Record<Lang, { ui: LegalUi; privacy: LegalDoc; terms: LegalDoc }> = {
  id: { ui: uiId, privacy: privacyId, terms: termsId },
  en: { ui: uiEn, privacy: privacyEn, terms: termsEn },
};
