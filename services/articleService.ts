import { AppLanguage, Article, HealthCondition, UserProfile } from '../types';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`;

type Localized = { title: string; summary: string; content: string[] };
type Source = Omit<Article, 'title' | 'summary' | 'content'> & { en: Localized; idn?: Localized };

// Evergreen, plain-language guides. No invented studies or statistics.
const SOURCES: Source[] = [
  {
    id: 'read-an-ingredient-list',
    category: 'Labels',
    readTime: 4,
    image: img('photo-1542838132-92c53300491e'),
    en: {
      title: 'How to read an ingredient list in 30 seconds',
      summary: 'Ingredients are listed by weight. The first three tell you most of the story.',
      content: [
        'Ingredient lists are ordered by weight, from most to least. Whatever appears first makes up the biggest share of the product. If sugar, refined flour or oil sits in the first three spots, that is what you are mostly buying.',
        'Sugar hides under many names: glucose syrup, dextrose, maltodextrin, cane juice, fruit concentrate and honey all count. When several of them appear separately, the total can be higher than any single entry suggests.',
        'A short list is not automatically healthier, but a long list full of words you cannot picture in a kitchen usually means a highly processed product.',
        'Check the allergen statement last. "Contains" lists what is in the recipe. "May contain" means the product was made near that allergen, which matters if your allergy is severe.'
      ]
    },
    idn: {
      title: 'Cara membaca daftar komposisi dalam 30 detik',
      summary: 'Komposisi diurutkan berdasarkan berat. Tiga teratas sudah menceritakan banyak hal.',
      content: [
        'Daftar komposisi diurutkan berdasarkan berat, dari yang terbanyak. Bahan yang muncul pertama adalah porsi terbesar produk. Jika gula, tepung olahan atau minyak ada di tiga teratas, itulah yang sebagian besar kamu beli.',
        'Gula punya banyak nama: sirup glukosa, dekstrosa, maltodekstrin, sari tebu, konsentrat buah dan madu. Jika beberapa muncul terpisah, totalnya bisa lebih tinggi dari yang terlihat.',
        'Daftar yang pendek belum tentu lebih sehat, tapi daftar panjang berisi nama yang tidak kamu kenal di dapur biasanya menandakan produk olahan tinggi.',
        'Cek pernyataan alergen di akhir. "Mengandung" berarti ada di resep. "Dapat mengandung" berarti diproduksi dekat alergen tersebut, penting jika alergimu berat.'
      ]
    }
  },
  {
    id: 'nutri-score-explained',
    category: 'Nutrition',
    readTime: 3,
    image: img('photo-1512621776951-a57141f2eefd'),
    en: {
      title: 'Nutri-Score, explained simply',
      summary: 'A to E grades compare products in the same aisle. Here is what they leave out.',
      content: [
        'Nutri-Score grades a food from A (dark green) to E (red) based on its nutrients per 100 g. Sugar, salt, saturated fat and calories pull the grade down. Fiber, protein, fruit, vegetables and nuts pull it up.',
        'It works best for comparing similar products, like two breakfast cereals. Comparing a cereal to an olive oil with it is less useful.',
        'It does not know about you. A B-graded product can still contain an ingredient you need to avoid. That is why VitalSense shows a personal score next to the Nutri-Score.'
      ]
    },
    idn: {
      title: 'Nutri-Score, dijelaskan dengan sederhana',
      summary: 'Nilai A sampai E membandingkan produk sejenis. Ini yang tidak dihitungnya.',
      content: [
        'Nutri-Score menilai makanan dari A (hijau tua) sampai E (merah) berdasarkan nutrisi per 100 g. Gula, garam, lemak jenuh dan kalori menurunkan nilai. Serat, protein, buah, sayur dan kacang menaikkannya.',
        'Paling berguna untuk membandingkan produk sejenis, misalnya dua sereal sarapan. Kurang berguna untuk membandingkan sereal dengan minyak zaitun.',
        'Nutri-Score tidak mengenal kondisimu. Produk bernilai B tetap bisa mengandung bahan yang perlu kamu hindari. Karena itu VitalSense menampilkan skor personal di samping Nutri-Score.'
      ]
    }
  },
  {
    id: 'pregnancy-skincare',
    category: 'Skin',
    readTime: 4,
    image: img('photo-1519689680058-324335c77eba'),
    conditions: [HealthCondition.PREGNANCY],
    en: {
      title: 'Skincare ingredients to pause during pregnancy',
      summary: 'A short list to check against your shelf, and gentler swaps.',
      content: [
        'Doctors commonly advise pausing retinoids during pregnancy. On labels they appear as retinol, retinyl palmitate, retinal, tretinoin or adapalene.',
        'High-strength salicylic acid peels and hydroquinone are also usually avoided. Low-strength salicylic acid in a rinse-off cleanser is often considered fine, but ask your doctor.',
        'Gentler options many people use instead: azelaic acid for breakouts and dark spots, niacinamide for oil and redness, and mineral sunscreen with zinc oxide.',
        'Bring the products you use to your next appointment. A quick look from your doctor or midwife beats guessing.'
      ]
    },
    idn: {
      title: 'Bahan skincare yang sebaiknya dijeda saat hamil',
      summary: 'Daftar singkat untuk dicek di rak skincare-mu, plus alternatif yang lebih lembut.',
      content: [
        'Dokter umumnya menyarankan menjeda retinoid saat hamil. Di label, namanya bisa retinol, retinyl palmitate, retinal, tretinoin atau adapalene.',
        'Peeling asam salisilat konsentrasi tinggi dan hidrokuinon juga biasanya dihindari. Asam salisilat dosis rendah di sabun cuci muka sering dianggap aman, tapi tanyakan ke doktermu.',
        'Alternatif yang lebih lembut: asam azelat untuk jerawat dan noda, niacinamide untuk minyak dan kemerahan, serta sunscreen mineral dengan zinc oxide.',
        'Bawa produkmu saat kontrol berikutnya. Pendapat singkat dari dokter atau bidan lebih baik daripada menebak.'
      ]
    }
  },
  {
    id: 'may-contain',
    category: 'Labels',
    readTime: 3,
    image: img('photo-1610832958506-aa56368176cf'),
    conditions: [HealthCondition.ALLERGIES, HealthCondition.AUTOIMMUNE],
    en: {
      title: '"May contain" warnings: what they really mean',
      summary: 'Precautionary labels are voluntary, which makes them tricky.',
      content: [
        'A "may contain" or "made in a facility with" line means the product could pick up traces of an allergen during production. It is not part of the recipe.',
        'These warnings are voluntary in many countries. A product without one is not a guarantee that it is free from cross-contact.',
        'If your allergy is severe, treat "may contain" as "contains", and contact the brand when in doubt. Many will tell you exactly how a line is cleaned.',
        'For gluten, look for a certified gluten-free mark rather than relying on the ingredient list alone.'
      ]
    },
    idn: {
      title: 'Peringatan "dapat mengandung": apa artinya',
      summary: 'Label pencegahan bersifat sukarela, jadi perlu dibaca dengan hati-hati.',
      content: [
        'Tulisan "dapat mengandung" atau "diproduksi di fasilitas yang juga mengolah" berarti produk bisa terkena sisa alergen saat produksi. Bahan itu bukan bagian dari resep.',
        'Di banyak negara peringatan ini sukarela. Produk tanpa peringatan belum tentu bebas kontaminasi silang.',
        'Jika alergimu berat, anggap "dapat mengandung" sama dengan "mengandung", dan hubungi produsennya jika ragu.',
        'Untuk gluten, cari logo bebas gluten bersertifikat, jangan hanya mengandalkan daftar komposisi.'
      ]
    }
  },
  {
    id: 'gentle-eating-treatment',
    category: 'Nutrition',
    readTime: 4,
    image: img('photo-1505253758473-96b701d36dec'),
    conditions: [HealthCondition.CANCER_CARE],
    en: {
      title: 'Eating gently during treatment',
      summary: 'Small, practical habits for days when food is hard.',
      content: [
        'Small meals every few hours are often easier than three large ones, especially with nausea.',
        'When your mouth is sore, soft, cool and mild foods tend to sit better. Skip acidic, very salty or crunchy snacks for a while.',
        'If your care team has told you your immune system is low, ask them which raw or unpasteurized foods to avoid.',
        'Your oncology dietitian knows your treatment plan. Use scans here to prepare questions for them, not to replace their advice.'
      ]
    },
    idn: {
      title: 'Makan dengan lembut selama pengobatan',
      summary: 'Kebiasaan kecil yang praktis untuk hari-hari ketika makan terasa sulit.',
      content: [
        'Makan porsi kecil setiap beberapa jam sering lebih mudah daripada tiga kali porsi besar, terutama saat mual.',
        'Saat mulut terasa perih, makanan lembut, dingin dan tidak berbumbu tajam biasanya lebih nyaman. Hindari makanan asam, sangat asin atau renyah sementara waktu.',
        'Jika tim medismu bilang daya tahan tubuhmu rendah, tanyakan makanan mentah atau tidak dipasteurisasi apa yang perlu dihindari.',
        'Ahli gizi onkologi paling tahu rencana pengobatanmu. Gunakan hasil pindaian di sini untuk menyiapkan pertanyaan, bukan sebagai pengganti saran mereka.'
      ]
    }
  },
  {
    id: 'sunscreen-basics',
    category: 'Skin',
    readTime: 3,
    image: img('photo-1447452001602-7090c774637d'),
    en: {
      title: 'Sunscreen is the step that does the most',
      summary: 'If you only add one product to your routine, make it this one.',
      content: [
        'Daily sunscreen helps prevent sunburn, dark spots and early signs of aging. It is worth wearing on cloudy days and near windows too.',
        'Look for "broad spectrum" and SPF 30 or higher. Use about two finger lengths for the face and neck.',
        'Mineral filters (zinc oxide, titanium dioxide) suit sensitive skin. Chemical filters are often lighter on darker skin tones. The best sunscreen is the one you will actually wear.',
        'Reapply every two hours outdoors, and after swimming or sweating.'
      ]
    },
    idn: {
      title: 'Sunscreen adalah langkah paling berdampak',
      summary: 'Jika hanya menambah satu produk ke rutinitasmu, pilih yang ini.',
      content: [
        'Sunscreen setiap hari membantu mencegah kulit terbakar, noda gelap dan tanda penuaan dini. Tetap pakai saat mendung atau di dekat jendela.',
        'Cari tulisan "broad spectrum" dan SPF 30 atau lebih. Gunakan sekitar dua ruas jari untuk wajah dan leher.',
        'Filter mineral (zinc oxide, titanium dioxide) cocok untuk kulit sensitif. Filter kimia sering terasa lebih ringan di kulit gelap. Sunscreen terbaik adalah yang benar-benar kamu pakai.',
        'Pakai ulang setiap dua jam saat di luar, dan setelah berenang atau berkeringat.'
      ]
    }
  },
  {
    id: 'hidden-sugar',
    category: 'Nutrition',
    readTime: 3,
    image: img('photo-1490645935967-10de6ba17061'),
    conditions: [HealthCondition.PREGNANCY, HealthCondition.GENERAL_HEALTH],
    en: {
      title: 'Where sugar hides in "healthy" snacks',
      summary: 'Granola, yogurt and protein bars deserve a second look.',
      content: [
        'Flavored yogurts, granola, cereal bars and bottled smoothies often carry as much sugar as a dessert. The front of the pack rarely says so.',
        'Compare the sugar line per 100 g between two options. It is the quickest way to spot the better pick on the shelf.',
        'Plain yogurt with fruit, or nuts with a piece of fruit, gives you sweetness with fiber that slows it down.',
        'If you are managing blood sugar, ask your care team for a daily target. It makes every label easier to judge.'
      ]
    },
    idn: {
      title: 'Tempat gula bersembunyi di camilan "sehat"',
      summary: 'Granola, yogurt dan protein bar layak dicek dua kali.',
      content: [
        'Yogurt berperisa, granola, sereal batang dan smoothie botolan sering mengandung gula sebanyak makanan penutup. Bagian depan kemasan jarang menyebutkannya.',
        'Bandingkan baris gula per 100 g di dua pilihan. Itu cara tercepat menemukan pilihan yang lebih baik di rak.',
        'Yogurt tawar dengan buah, atau kacang dengan buah, memberi rasa manis plus serat yang memperlambat penyerapannya.',
        'Jika sedang menjaga gula darah, tanyakan target harian ke tim medismu. Membaca label jadi jauh lebih mudah.'
      ]
    }
  },
  {
    id: 'symptom-journal',
    category: 'Wellness',
    readTime: 3,
    image: img('photo-1499209974431-2761e2523676'),
    conditions: [HealthCondition.AUTOIMMUNE, HealthCondition.ALLERGIES, HealthCondition.MORE_DISEASES],
    en: {
      title: 'Spot your triggers with a simple symptom log',
      summary: 'Two minutes a day can show patterns you would otherwise miss.',
      content: [
        'Note what you ate, what you put on your skin and how you felt, once a day. A few words is enough.',
        'Patterns usually show up after two or three weeks. Look for symptoms that follow the same food or product more than once.',
        'Updating your symptoms in VitalSense helps too: when you feel off, results weigh irritating ingredients more heavily.',
        'Share the log with your doctor. Real notes make appointments faster and more useful.'
      ]
    },
    idn: {
      title: 'Kenali pemicumu dengan catatan gejala sederhana',
      summary: 'Dua menit sehari bisa menunjukkan pola yang biasanya terlewat.',
      content: [
        'Catat apa yang kamu makan, apa yang kamu pakai di kulit dan bagaimana rasanya, sekali sehari. Beberapa kata sudah cukup.',
        'Pola biasanya terlihat setelah dua atau tiga minggu. Perhatikan gejala yang muncul setelah makanan atau produk yang sama lebih dari sekali.',
        'Memperbarui gejala di VitalSense juga membantu: saat kamu kurang sehat, hasil akan lebih ketat menilai bahan yang bisa memicu iritasi.',
        'Bagikan catatanmu ke dokter. Catatan nyata membuat konsultasi lebih cepat dan berguna.'
      ]
    }
  }
];

const localize = (s: Source, lang: AppLanguage): Article => {
  const copy = (lang === AppLanguage.ID && s.idn) || s.en;
  const { en, idn, ...rest } = s;
  return { ...rest, ...copy };
};

export const getDailyFeed = (profile: UserProfile | null): Article[] => {
  const lang = profile?.language || AppLanguage.EN;
  const condition = profile?.condition;
  const relevant = (s: Source) => (condition && s.conditions?.includes(condition) ? 0 : s.conditions ? 2 : 1);
  return [...SOURCES].sort((a, b) => relevant(a) - relevant(b)).map((s) => localize(s, lang));
};

export const FALLBACK_IMAGE = img('photo-1499209974431-2761e2523676');
