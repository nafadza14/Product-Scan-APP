export const APP_URL = "https://app.scanything.online";

export type Lang = "id" | "en";

const id = {
  skip: "Langsung ke isi",
  nav: { how: "Cara kerja", skin: "Untuk kulitmu", patterns: "Pola", privacy: "Privasi", pricing: "Harga", faq: "FAQ" },
  cta: "Mulai gratis",
  menu: "Menu",
  close: "Tutup",
  hero: {
    title: ["Yang kamu makan,", "terlihat di kulitmu."],
    lead: "Scan label makanan dan skincare, foto makananmu, cek kulit dengan selfie. Scanything menghubungkan semuanya dan bilang apa yang cocok untuk kulitmu.",
    primary: "Mulai gratis di browser",
    ios: ["Segera hadir di", "App Store"],
    android: ["Segera hadir di", "Google Play"],
    toastTitle: "Scan selesai",
    toastBody: "Granola madu · Kurang cocok untuk kulitmu",
  },
  how: {
    title: "Satu kamera, empat cara.",
    lead: "Arahkan kamera ke apa pun yang kamu makan atau pakai. Hasilnya langsung disesuaikan dengan kondisi kulit dan tubuhmu.",
    tabs: [
      { key: "label", label: "Label", stat: "3 detik", statSub: "dari foto label ke skor personal", title: "Label makanan", body: "Skor 0 sampai 100 untukmu, bahan yang perlu diwaspadai, dan efeknya ke kulit." },
      { key: "selfie", label: "Selfie", stat: "6 zona", statSub: "wajah dianalisis di setiap cek", title: "Cek kulit", body: "Jerawat, noda, pori, kemerahan, dan kelembapan. Lengkap dengan rutinitas pagi dan malam." },
      { key: "meal", label: "Makanan", stat: "1 foto", statSub: "cukup untuk mencatat satu menu", title: "Foto makanan", body: "Gula, susu, gorengan, omega-3. Semua tercatat untuk melihat polanya di kulitmu." },
      { key: "plan", label: "Rencana", stat: "13", statSub: "pertanyaan singkat, satu rencana personal", title: "Rencana kulit", body: "Makanan yang dikurangi dan diperbanyak, plus rutinitas pagi dan malam sesuai kondisimu." },
    ],
  },
  skin: {
    eyebrow: "Untuk kulitmu",
    title: "Bukan skor yang sama untuk semua orang.",
    lead: "Scanything membaca cek kulit terakhirmu, tujuanmu, dan kondisi seperti hamil atau alergi. Granola yang sama bisa baik untuk satu orang dan kurang untuk orang lain.",
    points: [
      "Efek produk ke kulitmu, dengan alasannya",
      "Peringatan dari daftar hindarimu: gula, susu, pewangi, paraben, dan lainnya",
      "Alternatif yang lebih cocok untukmu",
    ],
  },
  patterns: {
    eyebrow: "Pola",
    title: "Lihat makanan apa yang kulitmu rasakan.",
    lead: "Catat makan dan cek kulit beberapa minggu. Scanything membandingkan skor kulitmu di hari dengan dan tanpa makanan tertentu.",
    insights: [
      { delta: "-7", text: "Di hari dengan minuman manis, skor kulitmu lebih rendah." },
      { delta: "+5", text: "Setelah tidur 7 jam atau lebih, skormu naik." },
      { delta: "-4", text: "Di hari dengan susu, jerawat di dagu lebih terlihat." },
    ],
    note: "Pola dari catatanmu sendiri, bukan diagnosis. Coba ubah satu hal dalam satu waktu.",
    flags: ["Gula", "Susu", "Gorengan", "Karbo cepat", "Omega-3", "Sayur", "Buah", "Kafein", "Pedas", "Air"],
  },
  features: {
    title: "Semua yang kulitmu butuhkan, satu app.",
    items: [
      { key: "plan", title: "Rencana kulit personal", body: "Kuis singkat dan satu selfie. Hasilnya: makanan yang dikurangi, yang diperbanyak, dan rutinitas AM/PM." },
      { key: "avoid", title: "Daftar hindari", body: "Pilih bahan yang ingin kamu jauhi. Setiap scan memeriksanya dan memberi peringatan." },
      { key: "diary", title: "Jurnal kulit dan streak", body: "Checklist rutinitas, tidur, stres, dan catatan harian dalam satu layar." },
      { key: "progress", title: "Kartu progres", body: "Sebelum dan sesudah, siap dibagikan ke story." },
    ],
  },
  privacy: {
    title: "Kulitmu, urusanmu.",
    lead: "Foto wajah dan data kesehatan itu pribadi. Kami memperlakukannya seperti itu.",
    cards: [
      { title: "Foto tetap pribadi", body: "Foto cek kulit disimpan di penyimpanan privat yang hanya bisa diakses akunmu." },
      { title: "Skor tidak bisa dibeli", body: "Merek tidak bisa membayar untuk mengubah skor produk." },
      { title: "Tautan belanja diberi label", body: "Kalau ada tautan afiliasi, kami tandai dengan jelas." },
      { title: "Kamu yang pegang kendali", body: "Hapus scan, foto, dan catatan kapan saja." },
    ],
  },
  pricing: {
    title: "Mulai gratis.",
    lead: "Coba semua fitur Premium 7 hari tanpa biaya.",
    free: { name: "Gratis", price: "Rp0", per: "selamanya", items: ["3 scan produk per hari", "Cek kulit dan rencana personal", "Jurnal, makanan, dan rutinitas"], cta: "Mulai gratis" },
    premium: { name: "Premium", price: "Rp199.000", per: "per tahun", badge: "Paling hemat", items: ["Scan tanpa batas", "Pola makanan dan kulit", "Rencana diperbarui setiap cek kulit", "Kartu progres"], cta: "Coba gratis 7 hari" },
    note: "Atau Rp39.000 per bulan. Berhenti kapan saja.",
  },
  closing: { title: "Mulai dari satu scan.", lead: "Tidak perlu install. Buka di browser HP-mu dan scan produk pertama dalam satu menit.", cta: "Buka Scanything" },
  faq: {
    title: "Pertanyaan umum",
    items: [
      { q: "Apakah Scanything menggantikan dokter kulit?", a: "Tidak. Scanything memberi panduan kesehatan umum dan membantu kamu melihat pola. Untuk masalah kulit yang menetap atau memburuk, temui dokter kulit." },
      { q: "Bagaimana skor dihitung?", a: "AI membaca label atau foto, lalu menilai kecocokannya dengan profil, kondisi, cek kulit terakhir, dan daftar hindarimu. Produk yang sama bisa mendapat skor berbeda untuk orang yang berbeda." },
      { q: "Apakah aman saat hamil?", a: "Saat kamu menandai hamil atau menyusui, Scanything lebih ketat menilai bahan seperti retinoid, vitamin A dosis tinggi, dan gula tinggi." },
      { q: "Apakah perlu download app?", a: "Belum perlu. Scanything bisa dipakai langsung di browser HP. Versi App Store dan Google Play segera hadir." },
      { q: "Apa saja yang gratis?", a: "Cek kulit, rencana personal, jurnal, catat makanan, dan 3 scan produk per hari. Premium membuka scan tanpa batas dan pola makanan dan kulit." },
    ],
  },
  footer: {
    tagline: "Yang kamu makan, terlihat di kulitmu.",
    cols: [
      { title: "Produk", links: [["Cara kerja", "#cara"], ["Pola", "#pola"], ["Harga", "#harga"], ["Buka app", APP_URL]] },
      { title: "Bantuan", links: [["FAQ", "#faq"], ["Privasi", "#privasi"], ["Kebijakan Privasi", "/privacy"], ["Syarat dan Ketentuan", "/terms"]] },
    ],
    disclaimer: "Scanything memberi panduan kesehatan umum, bukan nasihat medis.",
  },
};

const en: typeof id = {
  skip: "Skip to content",
  nav: { how: "How it works", skin: "For your skin", patterns: "Patterns", privacy: "Privacy", pricing: "Pricing", faq: "FAQ" },
  cta: "Start free",
  menu: "Menu",
  close: "Close",
  hero: {
    title: ["What you eat", "shows on your skin."],
    lead: "Scan food and skincare labels, snap your meals, check your skin with a selfie. Scanything connects it all and tells you what suits your skin.",
    primary: "Start free in your browser",
    ios: ["Coming soon to", "App Store"],
    android: ["Coming soon to", "Google Play"],
    toastTitle: "Scan complete",
    toastBody: "Honey granola · Not great for your skin",
  },
  how: {
    title: "One camera, four ways.",
    lead: "Point your camera at anything you eat or apply. Results are tuned to your skin and your body.",
    tabs: [
      { key: "label", label: "Label", stat: "3 sec", statSub: "from label photo to personal score", title: "Food labels", body: "A 0 to 100 score for you, ingredients to watch, and how it may affect your skin." },
      { key: "selfie", label: "Selfie", stat: "6 zones", statSub: "of your face read in every check", title: "Skin check", body: "Breakouts, dark spots, pores, redness and hydration, with a morning and evening routine." },
      { key: "meal", label: "Meals", stat: "1 photo", statSub: "is all it takes to log a meal", title: "Meal photos", body: "Sugar, dairy, fried food, omega-3. Logged so you can see the pattern on your skin." },
      { key: "plan", label: "Plan", stat: "13", statSub: "quick questions, one personal plan", title: "Skin plan", body: "Foods to cut back and add, plus a morning and evening routine that fits you." },
    ],
  },
  skin: {
    eyebrow: "For your skin",
    title: "Not the same score for everyone.",
    lead: "Scanything reads your latest skin check, your goals and conditions like pregnancy or allergies. The same granola can be fine for one person and a poor pick for another.",
    points: ["How a product may affect your skin, and why", "Warnings from your avoid list: sugar, dairy, fragrance, parabens and more", "Better picks for you"],
  },
  patterns: {
    eyebrow: "Patterns",
    title: "See which foods your skin feels.",
    lead: "Log meals and skin checks for a few weeks. Scanything compares your skin score on days with and without each food.",
    insights: [
      { delta: "-7", text: "On days with sugary drinks, your skin score is lower." },
      { delta: "+5", text: "After 7 or more hours of sleep, your score goes up." },
      { delta: "-4", text: "On days with dairy, chin breakouts show more." },
    ],
    note: "Patterns from your own logs, not a diagnosis. Change one thing at a time.",
    flags: ["Sugar", "Dairy", "Fried", "Fast carbs", "Omega-3", "Veggies", "Fruit", "Caffeine", "Spicy", "Water"],
  },
  features: {
    title: "Everything your skin needs, one app.",
    items: [
      { key: "plan", title: "Personal skin plan", body: "A short quiz and one selfie. You get foods to cut back, foods to add and an AM/PM routine." },
      { key: "avoid", title: "Avoid list", body: "Pick the ingredients you want to stay away from. Every scan checks and warns you." },
      { key: "diary", title: "Skin diary and streaks", body: "Routine checklist, sleep, stress and notes on one screen." },
      { key: "progress", title: "Progress cards", body: "Before and after, ready for your story." },
    ],
  },
  privacy: {
    title: "Your skin, your business.",
    lead: "Face photos and health data are personal. We treat them that way.",
    cards: [
      { title: "Photos stay private", body: "Skin check photos live in private storage only your account can reach." },
      { title: "Scores are not for sale", body: "Brands cannot pay to change a product score." },
      { title: "Shop links are labelled", body: "Affiliate links are always clearly marked." },
      { title: "You stay in control", body: "Delete scans, photos and notes any time." },
    ],
  },
  pricing: {
    title: "Start free.",
    lead: "Try every Premium feature free for 7 days.",
    free: { name: "Free", price: "$0", per: "forever", items: ["3 product scans a day", "Skin check and personal plan", "Diary, meals and routine"], cta: "Start free" },
    premium: { name: "Premium", price: "$39.99", per: "per year", badge: "Best value", items: ["Unlimited scans", "Food and skin patterns", "Plan updated after every skin check", "Progress cards"], cta: "Try free for 7 days" },
    note: "Or $7.99 a month. Cancel anytime.",
  },
  closing: { title: "Start with one scan.", lead: "No install needed. Open it in your phone browser and scan your first product in a minute.", cta: "Open Scanything" },
  faq: {
    title: "Questions",
    items: [
      { q: "Does Scanything replace a dermatologist?", a: "No. Scanything gives general wellness guidance and helps you spot patterns. For skin problems that last or get worse, see a dermatologist." },
      { q: "How is the score worked out?", a: "AI reads the label or photo, then rates how well it fits your profile, conditions, latest skin check and avoid list. The same product can score differently for different people." },
      { q: "Is it okay during pregnancy?", a: "When you mark pregnancy or breastfeeding, Scanything is stricter about ingredients such as retinoids, high-dose vitamin A and high sugar." },
      { q: "Do I need to download an app?", a: "Not yet. Scanything works in your phone browser. App Store and Google Play versions are coming soon." },
      { q: "What is free?", a: "Skin checks, your personal plan, the diary, meal logging and 3 product scans a day. Premium unlocks unlimited scans and food and skin patterns." },
    ],
  },
  footer: {
    tagline: "What you eat shows on your skin.",
    cols: [
      { title: "Product", links: [["How it works", "#cara"], ["Patterns", "#pola"], ["Pricing", "#harga"], ["Open the app", APP_URL]] },
      { title: "Help", links: [["FAQ", "#faq"], ["Privacy", "#privasi"], ["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]] },
    ],
    disclaimer: "Scanything gives general wellness guidance, not medical advice.",
  },
};

export const COPY = { id, en };
export type Copy = typeof id;
