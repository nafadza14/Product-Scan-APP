"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "framer-motion";
import { APP_URL, COPY, type Lang } from "./content";
import { LEGAL, LEGAL_COPY, type LegalKind } from "./legal";
import { softSpring } from "./motion";

const isLang = (v: string | null): v is Lang => v === "id" || v === "en";

/** Language order: ?lang= (the mobile app passes its current language), then the saved choice, then the browser. */
function readClientLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLang(fromUrl)) return fromUrl;
    const saved = localStorage.getItem("sc_lang");
    if (isLang(saved)) return saved;
  } catch {
    /* storage blocked */
  }
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}
const noSubscribe = () => () => {};

/** Turns [label](href) and the contact email into links; everything else stays plain text. */
function Rich({ text }: { text: string }) {
  const escaped = LEGAL.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\[([^\\]]+)\\]\\(([^)]+)\\)|(${escaped})`, "g");
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    if (m[3]) {
      out.push(
        <a key={i} href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>,
      );
    } else {
      out.push(
        <Link key={i} href={m[2]}>
          {m[1]}
        </Link>,
      );
    }
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className={`logo ${dark ? "logo--dark" : ""}`} aria-label="Scanything">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sites/scanything/icon.svg" alt="" width={36} height={36} />
      <span>scanything</span>
    </Link>
  );
}

export function LegalPage({ kind }: { kind: LegalKind }) {
  // The prerendered HTML is Indonesian; the browser then picks the language from the URL or storage.
  const detected = useSyncExternalStore(noSubscribe, readClientLang, () => "id" as Lang);
  const [picked, setPicked] = useState<Lang | null>(null);
  const lang = picked ?? detected;
  const [scrolled, setScrolled] = useState(false);
  const c = COPY[lang];
  const { ui, ...docs } = LEGAL_COPY[lang];
  const doc = docs[kind];
  const other: LegalKind = kind === "privacy" ? "terms" : "privacy";

  // A ?lang= link from the app also becomes the saved choice for the rest of the site.
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (isLang(fromUrl)) localStorage.setItem("sc_lang", fromUrl);
    } catch {
      /* storage blocked */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const toggle = () => {
    const next: Lang = lang === "id" ? "en" : "id";
    setPicked(next);
    try {
      localStorage.setItem("sc_lang", next);
      // Keep a shared ?lang= link in step with the choice so a reload does not flip it back.
      const url = new URL(window.location.href);
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", next);
        window.history.replaceState(null, "", url);
      }
    } catch {
      /* storage blocked */
    }
  };

  return (
    <>
      <a href="#main" className="skip">
        {c.skip}
      </a>

      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="wrap site-header__inner">
          <Logo />
          <div className="site-header__right">
            <button className="lang" onClick={toggle} aria-label={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}>
              <GlobeIcon />
              {lang === "id" ? "EN" : "ID"}
            </button>
            <motion.a href={APP_URL} className="pill pill--sm" whileTap={{ scale: 0.96 }} transition={softSpring}>
              {c.cta}
            </motion.a>
          </div>
        </div>
      </header>

      <main id="main" className="legal surface-white" lang={lang}>
        <div className="wrap">
          <header className="legal__head">
            <span className="eyebrow">{ui.eyebrow}</span>
            <h1 className="legal__title">{doc.title}</h1>
            <p className="legal__updated">
              {ui.updatedLabel}: <time dateTime="2026-10-14">{ui.updatedDate}</time>
            </p>
            {doc.intro.map((p) => (
              <p key={p} className="legal__intro">
                <Rich text={p} />
              </p>
            ))}
          </header>

          <div className="legal__body">
            <nav className="legal__toc" aria-label={ui.contents}>
              <h2>{ui.contents}</h2>
              <ol>
                {doc.sections.map((s, i) => (
                  <li key={s.heading}>
                    <a href={`#s${i + 1}`}>{s.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>

            {doc.sections.map((s, i) => (
              <section key={s.heading} id={`s${i + 1}`} className={`legal__section ${s.highlight ? "legal__section--hi" : ""}`}>
                <h2>
                  <span className="legal__num">{i + 1}.</span> {s.heading}
                </h2>
                {s.body.map((b, k) =>
                  typeof b === "string" ? (
                    <p key={k}>
                      <Rich text={b} />
                    </p>
                  ) : (
                    <ul key={k}>
                      {b.map((li) => (
                        <li key={li}>
                          <Rich text={li} />
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}

            <div className="legal__next">
              <Link href={`/${other}`} className="card card--mist legal__next-card">
                <small>{ui.seeAlso}</small>
                <b>{ui.docs[other]}</b>
                <span aria-hidden>→</span>
              </Link>
              <Link href="/" className="legal__home">
                {ui.backHome}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer surface-dark">
        <div className="wrap">
          <Logo dark />
          <p className="site-footer__tag">{c.footer.tagline}</p>
          <div className="site-footer__cols">
            {c.footer.cols.map((col) => (
              <div key={col.title}>
                <h4>{col.title}</h4>
                {col.links.map(([l, h]) =>
                  h.startsWith("http") ? (
                    <a key={l} href={h}>
                      {l}
                    </a>
                  ) : (
                    <Link key={l} href={h.startsWith("#") ? `/${h}` : h} aria-current={h === `/${kind}` ? "page" : undefined}>
                      {l}
                    </Link>
                  ),
                )}
              </div>
            ))}
          </div>
          <p className="fine fine--dark">{c.footer.disclaimer}</p>
          <p className="fine fine--dark">© {new Date().getFullYear()} {LEGAL.brand} · {LEGAL.entity}</p>
        </div>
      </footer>
    </>
  );
}
