// Copy for the Scanything brand message, skin match on product results, and the avoid list.
// Merged last into i18n.ts, so heroTitle and homeSub here replace the older copy.

export const matchEn = {
  homeSub: 'What you eat and what you apply both show on your skin.',
  heroTitle: 'What you eat shows on your skin.',

  gradeExcellent: 'Excellent',
  gradeGood: 'Good',
  gradePoor: 'Poor',
  gradeBad: 'Bad',

  skinMatchTitle: 'For your skin',
  skinMatchBasedOn: 'Based on your last skin check: {info}',
  skinMatchNoCheck: 'Check your skin once and every scan will also tell you how the product affects your skin.',
  skinMatchCta: 'Check my skin',
  impactGood: 'Good for your skin',
  impactNeutral: 'Little effect on your skin',
  impactBad: 'May work against your skin',

  avoidHitTitle: 'On your avoid list',
  avoidHitBody: 'Contains {items}.',
  avoidEdit: 'Edit list',
  avoidTitle: 'My avoid list',
  avoidSub: 'Pick what you want to stay away from. Every scan checks for it and warns you.',
  avoidFood: 'In food',
  avoidSkin: 'In skincare',
  avoidRow: 'Avoid list',
  avoidCount: '{n} items',
  avoidNone: 'Not set',

  av_addedSugar: 'Added sugar',
  av_dairy: 'Dairy',
  av_gluten: 'Gluten',
  av_palmOil: 'Palm oil',
  av_sweeteners: 'Artificial sweeteners',
  av_caffeine: 'Caffeine',
  av_fragrance: 'Fragrance',
  av_alcohol: 'Drying alcohol',
  av_essentialOils: 'Essential oils',
  av_parabens: 'Parabens',
  av_sulfates: 'Sulfates',
  av_silicones: 'Silicones',
  av_retinoids: 'Retinoids',
  av_comedogenic: 'Pore-clogging oils'
};

type MatchDict = Record<keyof typeof matchEn, string>;

export const matchId: MatchDict = {
  homeSub: 'Yang kamu makan dan yang kamu pakai, dua-duanya terlihat di kulit.',
  heroTitle: 'Yang kamu makan terlihat di kulitmu.',

  gradeExcellent: 'Sangat baik',
  gradeGood: 'Baik',
  gradePoor: 'Kurang',
  gradeBad: 'Buruk',

  skinMatchTitle: 'Untuk kulitmu',
  skinMatchBasedOn: 'Berdasarkan cek kulit terakhirmu: {info}',
  skinMatchNoCheck: 'Cek kulitmu sekali, lalu setiap scan juga memberi tahu efek produk ke kulitmu.',
  skinMatchCta: 'Cek kulitku',
  impactGood: 'Baik untuk kulitmu',
  impactNeutral: 'Sedikit pengaruh ke kulitmu',
  impactBad: 'Bisa memperburuk kulitmu',

  avoidHitTitle: 'Ada di daftar hindarimu',
  avoidHitBody: 'Mengandung {items}.',
  avoidEdit: 'Ubah daftar',
  avoidTitle: 'Daftar hindari',
  avoidSub: 'Pilih bahan yang ingin kamu hindari. Setiap scan akan mengeceknya dan memberi peringatan.',
  avoidFood: 'Di makanan',
  avoidSkin: 'Di skincare',
  avoidRow: 'Daftar hindari',
  avoidCount: '{n} bahan',
  avoidNone: 'Belum diatur',

  av_addedSugar: 'Gula tambahan',
  av_dairy: 'Susu dan olahannya',
  av_gluten: 'Gluten',
  av_palmOil: 'Minyak sawit',
  av_sweeteners: 'Pemanis buatan',
  av_caffeine: 'Kafein',
  av_fragrance: 'Pewangi',
  av_alcohol: 'Alkohol yang mengeringkan',
  av_essentialOils: 'Minyak atsiri',
  av_parabens: 'Paraben',
  av_sulfates: 'Sulfat',
  av_silicones: 'Silikon',
  av_retinoids: 'Retinoid',
  av_comedogenic: 'Minyak penyumbat pori'
};

export const matchFr: MatchDict = {
  homeSub: 'Ce que vous mangez et ce que vous appliquez se voit sur votre peau.',
  heroTitle: 'Ce que vous mangez se voit sur votre peau.',

  gradeExcellent: 'Excellent',
  gradeGood: 'Bon',
  gradePoor: 'Médiocre',
  gradeBad: 'Mauvais',

  skinMatchTitle: 'Pour votre peau',
  skinMatchBasedOn: 'D\'après votre dernier bilan de peau : {info}',
  skinMatchNoCheck: 'Faites un bilan de peau une fois et chaque scan vous dira aussi l\'effet du produit sur votre peau.',
  skinMatchCta: 'Analyser ma peau',
  impactGood: 'Bon pour votre peau',
  impactNeutral: 'Peu d\'effet sur votre peau',
  impactBad: 'Peut nuire à votre peau',

  avoidHitTitle: 'Dans votre liste à éviter',
  avoidHitBody: 'Contient {items}.',
  avoidEdit: 'Modifier',
  avoidTitle: 'Ma liste à éviter',
  avoidSub: 'Choisissez ce que vous voulez éviter. Chaque scan le vérifie et vous prévient.',
  avoidFood: 'Dans l\'alimentation',
  avoidSkin: 'Dans les soins',
  avoidRow: 'Liste à éviter',
  avoidCount: '{n} éléments',
  avoidNone: 'Non définie',

  av_addedSugar: 'Sucres ajoutés',
  av_dairy: 'Produits laitiers',
  av_gluten: 'Gluten',
  av_palmOil: 'Huile de palme',
  av_sweeteners: 'Édulcorants',
  av_caffeine: 'Caféine',
  av_fragrance: 'Parfum',
  av_alcohol: 'Alcool asséchant',
  av_essentialOils: 'Huiles essentielles',
  av_parabens: 'Parabènes',
  av_sulfates: 'Sulfates',
  av_silicones: 'Silicones',
  av_retinoids: 'Rétinoïdes',
  av_comedogenic: 'Huiles comédogènes'
};

export const matchAr: MatchDict = {
  homeSub: 'ما تأكله وما تضعه على بشرتك يظهر كلاهما على بشرتك.',
  heroTitle: 'ما تأكله يظهر على بشرتك.',

  gradeExcellent: 'ممتاز',
  gradeGood: 'جيد',
  gradePoor: 'ضعيف',
  gradeBad: 'سيئ',

  skinMatchTitle: 'لبشرتك',
  skinMatchBasedOn: 'بناءً على آخر فحص لبشرتك: {info}',
  skinMatchNoCheck: 'افحص بشرتك مرة واحدة، وسيخبرك كل مسح أيضًا بتأثير المنتج على بشرتك.',
  skinMatchCta: 'افحص بشرتي',
  impactGood: 'مفيد لبشرتك',
  impactNeutral: 'تأثير بسيط على بشرتك',
  impactBad: 'قد يضر ببشرتك',

  avoidHitTitle: 'في قائمة التجنب',
  avoidHitBody: 'يحتوي على {items}.',
  avoidEdit: 'تعديل',
  avoidTitle: 'قائمة التجنب',
  avoidSub: 'اختر ما تريد تجنبه. كل مسح يتحقق منه وينبهك.',
  avoidFood: 'في الطعام',
  avoidSkin: 'في العناية بالبشرة',
  avoidRow: 'قائمة التجنب',
  avoidCount: '{n} عناصر',
  avoidNone: 'غير محددة',

  av_addedSugar: 'السكر المضاف',
  av_dairy: 'الألبان',
  av_gluten: 'الغلوتين',
  av_palmOil: 'زيت النخيل',
  av_sweeteners: 'المحليات الصناعية',
  av_caffeine: 'الكافيين',
  av_fragrance: 'العطور',
  av_alcohol: 'الكحول المجفف',
  av_essentialOils: 'الزيوت العطرية',
  av_parabens: 'البارابين',
  av_sulfates: 'الكبريتات',
  av_silicones: 'السيليكون',
  av_retinoids: 'الريتينويدات',
  av_comedogenic: 'زيوت تسد المسام'
};

export const matchZh: MatchDict = {
  homeSub: '吃进去的和涂上去的，都会体现在皮肤上。',
  heroTitle: '吃进去的，都会写在皮肤上。',

  gradeExcellent: '优秀',
  gradeGood: '良好',
  gradePoor: '较差',
  gradeBad: '差',

  skinMatchTitle: '对你的皮肤',
  skinMatchBasedOn: '根据你最近一次皮肤检测：{info}',
  skinMatchNoCheck: '做一次皮肤检测，之后每次扫描都会告诉你产品对皮肤的影响。',
  skinMatchCta: '检测我的皮肤',
  impactGood: '对皮肤有益',
  impactNeutral: '对皮肤影响不大',
  impactBad: '可能不利于皮肤',

  avoidHitTitle: '在你的避开清单中',
  avoidHitBody: '含有{items}。',
  avoidEdit: '编辑清单',
  avoidTitle: '我的避开清单',
  avoidSub: '选择你想避开的成分。每次扫描都会检查并提醒你。',
  avoidFood: '食品中',
  avoidSkin: '护肤品中',
  avoidRow: '避开清单',
  avoidCount: '{n} 项',
  avoidNone: '未设置',

  av_addedSugar: '添加糖',
  av_dairy: '乳制品',
  av_gluten: '麸质',
  av_palmOil: '棕榈油',
  av_sweeteners: '人工甜味剂',
  av_caffeine: '咖啡因',
  av_fragrance: '香精',
  av_alcohol: '致干酒精',
  av_essentialOils: '精油',
  av_parabens: '对羟基苯甲酸酯',
  av_sulfates: '硫酸盐',
  av_silicones: '硅油',
  av_retinoids: '视黄醇类',
  av_comedogenic: '致痘油脂'
};
