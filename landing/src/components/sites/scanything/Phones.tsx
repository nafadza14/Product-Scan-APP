import type { ReactNode } from "react";
import type { Lang } from "./content";

/** iPhone-style frame. Screens inside are drawn in HTML from Scanything's own app UI. */
export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`phone ${className}`}>
      <div className="phone__screen">
        <div className="phone__status">
          <span>9:41</span>
          <span className="phone__island" />
          <span className="phone__icons">
            <i />
            <i />
            <i />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

const t = (lang: Lang, idText: string, enText: string) => (lang === "id" ? idText : enText);

function Ring({ value, color, size = 54 }: { value: number; color: string; size?: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 54 54" width={size} height={size} className="mring" aria-hidden>
      <circle cx="27" cy="27" r={r} fill="none" stroke="#EEF2F1" strokeWidth="6" />
      <circle
        cx="27"
        cy="27"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        className="ring__arc"
        style={{ ["--c" as string]: c } as React.CSSProperties}
      />
      <text x="27" y="31" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0E2B2E">
        {value}
      </text>
    </svg>
  );
}

export function TodayScreen({ lang }: { lang: Lang }) {
  const meals = [
    { e: "🥗", n: t(lang, "Salad salmon", "Salmon salad"), s: t(lang, "Baik untuk kulitmu", "Good for your skin"), c: "#2E8C68", f: ["Omega-3", t(lang, "Sayur", "Veggies")] },
    { e: "🧋", n: t(lang, "Es teh susu", "Iced milk tea"), s: t(lang, "Bisa memperburuk kulitmu", "May work against your skin"), c: "#D2432F", f: [t(lang, "Gula", "Sugar"), t(lang, "Susu", "Dairy")] },
    { e: "🍳", n: t(lang, "Telur dan roti gandum", "Eggs on wholegrain toast"), s: t(lang, "Sedikit pengaruh", "Little effect"), c: "#6E8283", f: ["Protein"] },
  ];
  return (
    <div className="scr">
      <p className="scr__hi">{t(lang, "Hai Sarah", "Hi Sarah")} 👋</p>
      <div className="scr__plan">
        <span className="scr__planLabel">{t(lang, "Rencana kulitmu", "Your skin plan")}</span>
        <b>{t(lang, "Jerawat berkurang", "Fewer breakouts")}</b>
        <span className="scr__streak">🔥 {t(lang, "12 hari beruntun", "12-day streak")}</span>
      </div>
      <div className="scr__card scr__row">
        <div>
          <span className="scr__muted">{t(lang, "Cek kulit hari ini", "Today's skin check")}</span>
          <b className="scr__big">{t(lang, "Pori, sedikit jerawat", "Pores, mild breakouts")}</b>
          <span className="scr__up">+4 {t(lang, "sejak cek terakhir", "since last check")}</span>
        </div>
        <Ring value={78} color="#2E8C68" />
      </div>
      <div className="scr__card">
        <div className="scr__row scr__mb">
          <b>{t(lang, "Makan hari ini", "Meals today")}</b>
          <span className="scr__pill">{t(lang, "Catat", "Log")}</span>
        </div>
        {meals.map((m, i) => (
          <div key={m.n} className="scr__meal tx" style={{ animationDelay: `${0.9 + i * 0.18}s` }}>
            <span className="scr__emoji">{m.e}</span>
            <span className="scr__mealBody">
              <b>{m.n}</b>
              <span style={{ color: m.c }}>{m.s}</span>
              <span className="scr__flags">
                {m.f.map((f) => (
                  <i key={f}>{f}</i>
                ))}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LabelScreen({ lang }: { lang: Lang }) {
  return (
    <div className="scr">
      <div className="scr__prod">
        <span className="scr__prodIcon">🥣</span>
        <span>
          <span className="scr__muted">{t(lang, "Makanan", "Food")}</span>
          <b>{t(lang, "Granola madu", "Honey granola")}</b>
        </span>
      </div>
      <h4 className="scr__verdict">{t(lang, "Pakai dengan hati-hati", "Use with care")} ⚠️</h4>
      <div className="scr__alert">
        <b>{t(lang, "Ada di daftar hindarimu", "On your avoid list")}</b>
        <span>{t(lang, "Mengandung gula tambahan.", "Contains added sugar.")}</span>
      </div>
      <div className="scr__tiles">
        <div className="scr__tile">
          <span className="scr__muted">{t(lang, "Skormu", "Your score")}</span>
          <span className="scr__grade">{t(lang, "Kurang", "Poor")}</span>
          <div className="scr__row">
            <b className="scr__num">46</b>
            <Ring value={46} color="#DB8F1F" size={44} />
          </div>
        </div>
        <div className="scr__tile">
          <span className="scr__muted">Nutri-Score</span>
          <div className="scr__nutri">
            {["A", "B", "C", "D", "E"].map((g) => (
              <i key={g} className={g === "D" ? "on" : ""} data-g={g}>
                {g}
              </i>
            ))}
          </div>
        </div>
      </div>
      <div className="scr__card">
        <b>{t(lang, "Untuk kulitmu", "For your skin")}</b>
        <span className="scr__bad">👎 {t(lang, "Bisa memperburuk kulitmu", "May work against your skin")}</span>
        <p className="scr__small">{t(lang, "Gula tinggi bisa memperparah jerawat untuk kulit kombinasi.", "High sugar can make breakouts worse for combination skin.")}</p>
      </div>
    </div>
  );
}

export function SkincareScreen({ lang }: { lang: Lang }) {
  const ings = [
    { n: "Niacinamide", s: t(lang, "Cocok", "Good fit"), c: "#2E8C68" },
    { n: "Parfum", s: t(lang, "Di daftar hindari", "On avoid list"), c: "#D2432F" },
    { n: "Ceramide NP", s: t(lang, "Cocok", "Good fit"), c: "#2E8C68" },
    { n: "Alcohol denat.", s: t(lang, "Bisa mengeringkan", "May dry skin"), c: "#DB8F1F" },
  ];
  return (
    <div className="scr">
      <div className="scr__prod">
        <span className="scr__prodIcon">🧴</span>
        <span>
          <span className="scr__muted">Skincare</span>
          <b>{t(lang, "Serum pencerah", "Brightening serum")}</b>
        </span>
      </div>
      <div className="scr__tiles">
        <div className="scr__tile">
          <span className="scr__muted">{t(lang, "Skormu", "Your score")}</span>
          <span className="scr__grade" style={{ color: "#6BA644" }}>
            {t(lang, "Baik", "Good")}
          </span>
          <div className="scr__row">
            <b className="scr__num">68</b>
            <Ring value={68} color="#6BA644" size={44} />
          </div>
        </div>
        <div className="scr__tile">
          <span className="scr__muted">{t(lang, "Kulitmu", "Your skin")}</span>
          <b className="scr__big">{t(lang, "Kombinasi", "Combination")}</b>
          <span className="scr__small">{t(lang, "Pori, noda gelap", "Pores, dark spots")}</span>
        </div>
      </div>
      <div className="scr__card">
        <b className="scr__mbS">{t(lang, "Bahan penting", "Key ingredients")}</b>
        {ings.map((i, k) => (
          <div key={i.n} className="scr__ing tx" style={{ animationDelay: `${0.2 + k * 0.12}s` }}>
            <span>{i.n}</span>
            <i style={{ color: i.c, background: `${i.c}18` }}>{i.s}</i>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SelfieScreen({ lang }: { lang: Lang }) {
  const zones = [
    { n: t(lang, "Dahi", "Forehead"), v: 70 },
    { n: "T-zone", v: 55 },
    { n: t(lang, "Pipi kiri", "Left cheek"), v: 80 },
    { n: t(lang, "Dagu", "Chin"), v: 62 },
  ];
  return (
    <div className="scr">
      <div className="scr__face">
        <svg viewBox="0 0 160 190" aria-hidden>
          <ellipse cx="80" cy="95" rx="62" ry="80" fill="#FBE4D6" />
          <path d="M40 60 Q80 30 120 60" stroke="#F47B45" strokeWidth="3" fill="none" strokeDasharray="4 5" className="dash" />
          <ellipse cx="80" cy="100" rx="16" ry="34" fill="none" stroke="#F47B45" strokeWidth="3" strokeDasharray="4 5" className="dash" />
          <circle cx="44" cy="112" r="16" fill="none" stroke="#2E8C68" strokeWidth="3" strokeDasharray="4 5" className="dash" />
          <circle cx="116" cy="112" r="16" fill="none" stroke="#2E8C68" strokeWidth="3" strokeDasharray="4 5" className="dash" />
          <ellipse cx="80" cy="158" rx="22" ry="10" fill="none" stroke="#DB8F1F" strokeWidth="3" strokeDasharray="4 5" className="dash" />
        </svg>
        <span className="scr__scanline" />
      </div>
      <div className="scr__card scr__row">
        <div>
          <span className="scr__muted">{t(lang, "Skor kulit", "Skin score")}</span>
          <b className="scr__num">72</b>
        </div>
        <span className="scr__type">{t(lang, "Kombinasi", "Combination")}</span>
      </div>
      <div className="scr__card">
        {zones.map((z, i) => (
          <div key={z.n} className="scr__zone">
            <span>{z.n}</span>
            <span className="scr__bar">
              <i className="grow" style={{ width: `${z.v}%`, animationDelay: `${0.3 + i * 0.12}s`, background: z.v >= 70 ? "#2E8C68" : z.v >= 60 ? "#DB8F1F" : "#E9733A" }} />
            </span>
            <b>{z.v}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MealScreen({ lang }: { lang: Lang }) {
  return (
    <div className="scr">
      <div className="scr__photo">
        <span>🍛</span>
        <span className="scr__scanline" />
      </div>
      <div className="scr__card">
        <b>{t(lang, "Nasi goreng dan es teh manis", "Fried rice and sweet iced tea")}</b>
        <span className="scr__bad">{t(lang, "Bisa memperburuk kulitmu", "May work against your skin")}</span>
        <span className="scr__flags scr__flags--lg">
          {[t(lang, "Karbo cepat", "Fast carbs"), t(lang, "Gorengan", "Fried"), t(lang, "Gula", "Sugar")].map((f) => (
            <i key={f}>{f}</i>
          ))}
        </span>
        <p className="scr__small">{t(lang, "Kombinasi karbo cepat dan gula bisa memicu jerawat pada sebagian orang.", "Fast carbs plus sugar may trigger breakouts for some people.")}</p>
      </div>
      <div className="scr__card scr__row">
        <span className="scr__muted">{t(lang, "Tercatat di jurnal hari ini", "Saved to today's diary")}</span>
        <span className="scr__ok">✓</span>
      </div>
    </div>
  );
}

export function PatternScreen({ lang }: { lang: Lang }) {
  const pts = [52, 58, 49, 61, 57, 66, 63, 70, 68, 74, 72, 78];
  const max = 100;
  const w = 260;
  const h = 110;
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${h - (p / max) * h}`).join(" ");
  return (
    <div className="scr scr--dark">
      <span className="scr__muted">{t(lang, "Skor kulit, 30 hari", "Skin score, 30 days")}</span>
      <div className="scr__row">
        <b className="scr__num">78</b>
        <span className="scr__delta">+26</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 6}`} className="scr__chart" aria-hidden>
        <path d={`${path} L${w},${h} L0,${h} Z`} fill="url(#g)" opacity="0.5" />
        <path d={path} fill="none" stroke="#F47B45" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" className="draw" pathLength={1} />
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F47B45" stopOpacity="0.5" />
            <stop offset="1" stopColor="#F47B45" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="scr__bars">
        {[0.55, 0.8, 0.45, 0.9, 0.6, 0.75, 0.5].map((v, i) => (
          <i key={i} style={{ ["--v" as string]: v, animationDelay: `${i * 0.15}s` } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
