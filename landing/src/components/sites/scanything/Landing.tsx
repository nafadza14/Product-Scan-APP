"use client";

import { useEffect, useRef, useState } from "react";
import { APP_URL, COPY, type Lang } from "./content";
import { LabelScreen, MealScreen, PatternScreen, PhoneFrame, SelfieScreen, SkincareScreen, TodayScreen } from "./Phones";

/** Adds .is-in to [data-reveal] elements once they scroll into view. */
function useReveal(dep: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
      <path
        fill="currentColor"
        d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.17-1.54 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.5ZM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.96-.49 2.56-1.23Z"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path fill="#34A853" d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Z" />
      <path fill="#FBBC04" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.8 2.2c1 .6 1 1.6 0 2.2l-3.8 2.2Z" />
      <path fill="#4285F4" d="M16.7 15.3 13.4 12l-9.8 9.7c.4.2.9.2 1.4-.1l11.7-6.3Z" />
      <path fill="#EA4335" d="M16.7 8.7 5 2.4c-.5-.3-1-.3-1.4-.1L13.4 12l3.3-3.3Z" />
    </svg>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#top" className={`logo ${dark ? "logo--dark" : ""}`} aria-label="Scanything">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sites/scanything/icon.svg" alt="" width={36} height={36} />
      <span>scanything</span>
    </a>
  );
}

const FEATURE_ICONS: Record<string, string> = { plan: "✨", avoid: "🚫", diary: "📓", progress: "📸" };

export function Landing() {
  const [lang, setLang] = useState<Lang>("id");
  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(true);
  const [faq, setFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const c = COPY[lang];
  const tabsRef = useRef<HTMLDivElement>(null);

  useReveal(lang);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sc_lang");
      if (saved === "en" || saved === "id") setLang(saved);
      else if (!navigator.language.toLowerCase().startsWith("id")) setLang("en");
    } catch {
      /* storage blocked */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("sc_lang", lang);
    } catch {
      /* storage blocked */
    }
  }, [lang]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Tabs advance by themselves while the section is visible, until the visitor picks one.
  useEffect(() => {
    if (!auto) return;
    const el = tabsRef.current;
    let visible = false;
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting), { threshold: 0.4 });
    if (el) io.observe(el);
    const id = window.setInterval(() => visible && setTab((x) => (x + 1) % 4), 4200);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [auto]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const screens = [<LabelScreen key="l" lang={lang} />, <SkincareScreen key="s" lang={lang} />, <SelfieScreen key="f" lang={lang} />, <MealScreen key="m" lang={lang} />];
  const navLinks: [string, string][] = [
    [c.nav.how, "#cara"],
    [c.nav.skin, "#kulit"],
    [c.nav.patterns, "#pola"],
    [c.nav.privacy, "#privasi"],
    [c.nav.pricing, "#harga"],
    [c.nav.faq, "#faq"],
  ];

  return (
    <>
      <a href="#main" className="skip">
        {c.skip}
      </a>

      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="wrap site-header__inner">
          <Logo />
          <nav className="site-header__nav" aria-label="Main">
            {navLinks.slice(0, 5).map(([l, h]) => (
              <a key={h} href={h}>
                {l}
              </a>
            ))}
          </nav>
          <div className="site-header__right">
            <button className="lang" onClick={() => setLang(lang === "id" ? "en" : "id")} aria-label={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              {lang === "id" ? "EN" : "ID"}
            </button>
            <a href={APP_URL} className="pill pill--sm">
              {c.cta}
            </a>
            <button className={`burger ${menu ? "is-open" : ""}`} onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label={menu ? c.close : c.menu}>
              <i />
              <i />
            </button>
          </div>
        </div>
        <div className={`sheet ${menu ? "is-open" : ""}`} aria-hidden={!menu}>
          <nav className="wrap sheet__nav">
            {navLinks.map(([l, h], i) => (
              <a key={h} href={h} onClick={() => setMenu(false)} style={{ transitionDelay: menu ? `${0.04 * i + 0.05}s` : "0s" }} tabIndex={menu ? 0 : -1}>
                {l}
              </a>
            ))}
            <a href={APP_URL} className="pill" tabIndex={menu ? 0 : -1}>
              {c.cta}
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section id="top" className="hero surface-white">
          <div className="wrap hero__inner">
            <h1 className="hero__title">
              <span className="hero-in" style={{ animationDelay: "0.05s" }}>
                {c.hero.title[0]}
              </span>
              <span className="hero-in hero__accent" style={{ animationDelay: "0.15s" }}>
                {c.hero.title[1]}
              </span>
            </h1>
            <p className="lead hero__lead hero-in" style={{ animationDelay: "0.25s" }}>
              {c.hero.lead}
            </p>
            <div className="hero__ctas hero-in" style={{ animationDelay: "0.35s" }}>
              <a href={APP_URL} className="pill pill--lg">
                {c.hero.primary}
              </a>
              <div className="hero__stores">
                <span className="store" aria-disabled="true">
                  <AppleIcon />
                  <span>
                    <small>{c.hero.ios[0]}</small>
                    <b>{c.hero.ios[1]}</b>
                  </span>
                </span>
                <span className="store" aria-disabled="true">
                  <PlayIcon />
                  <span>
                    <small>{c.hero.android[0]}</small>
                    <b>{c.hero.android[1]}</b>
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="hero__stage hero-stage">
            <div className="hero__orb" aria-hidden />
            <div className="hero__chips" aria-hidden>
              <span className="chip chip--a">🥣 46</span>
              <span className="chip chip--b">🧴 {lang === "id" ? "Cocok" : "Good fit"}</span>
              <span className="chip chip--c">🥗 Omega-3</span>
            </div>
            <PhoneFrame className="hero__phone">
              <div className="toast">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sites/scanything/icon.svg" alt="" width={22} height={22} />
                <span>
                  <b>{c.hero.toastTitle}</b>
                  <span>{c.hero.toastBody}</span>
                </span>
              </div>
              <TodayScreen lang={lang} />
            </PhoneFrame>
          </div>
        </section>

        {/* How it works */}
        <section id="cara" className="section surface-panel">
          <div className="wrap">
            <header className="section__head">
              <h2 className="h2" data-reveal>
                {c.how.title}
              </h2>
              <p className="lead" data-reveal>
                {c.how.lead}
              </p>
            </header>
            <div className="tabs" ref={tabsRef}>
              <div className="seg" role="tablist" aria-label={c.nav.how}>
                <span className="seg__bubble" style={{ transform: `translateX(${tab * 100}%)` }} />
                {c.how.tabs.map((tb, i) => (
                  <button
                    key={tb.key}
                    role="tab"
                    aria-selected={tab === i}
                    className={tab === i ? "is-on" : ""}
                    onClick={() => {
                      setAuto(false);
                      setTab(i);
                    }}
                  >
                    {tb.label}
                    {auto && tab === i && <span className="seg__progress" key={`p${i}`} />}
                  </button>
                ))}
              </div>
              <div className="tabs__body">
                <PhoneFrame className="tabs__phone">
                  <div key={`${tab}-${lang}`} className="swap">
                    {screens[tab]}
                  </div>
                </PhoneFrame>
                <div key={`t${tab}-${lang}`} className="tabs__copy swap">
                  <span className="stat">{c.how.tabs[tab].stat}</span>
                  <span className="stat__sub">{c.how.tabs[tab].statSub}</span>
                  <h3>{c.how.tabs[tab].title}</h3>
                  <p>{c.how.tabs[tab].body}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For your skin */}
        <section id="kulit" className="section surface-white">
          <div className="wrap split">
            <div>
              <span className="eyebrow" data-reveal>
                {c.skin.eyebrow}
              </span>
              <h2 className="h2" data-reveal>
                {c.skin.title}
              </h2>
              <p className="lead" data-reveal>
                {c.skin.lead}
              </p>
              <ul className="checks">
                {c.skin.points.map((p, i) => (
                  <li key={p} data-reveal style={{ transitionDelay: `${i * 0.08}s` }}>
                    <span className="checks__dot">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="split__visual" data-reveal>
              <PhoneFrame>
                <LabelScreen lang={lang} />
              </PhoneFrame>
            </div>
          </div>
        </section>

        {/* Patterns, dark */}
        <section id="pola" className="section surface-dark">
          <div className="wrap split">
            <div>
              <span className="eyebrow eyebrow--dark" data-reveal>
                {c.patterns.eyebrow}
              </span>
              <h2 className="h2" data-reveal>
                {c.patterns.title}
              </h2>
              <p className="lead lead--dark" data-reveal>
                {c.patterns.lead}
              </p>
              <ul className="insights">
                {c.patterns.insights.map((i, k) => (
                  <li key={i.text} data-reveal style={{ transitionDelay: `${k * 0.1}s` }}>
                    <span className={`insights__delta ${i.delta.startsWith("+") ? "up" : "down"}`}>{i.delta}</span>
                    {i.text}
                  </li>
                ))}
              </ul>
              <p className="fine fine--dark">{c.patterns.note}</p>
            </div>
            <div className="split__visual" data-reveal>
              <PhoneFrame className="phone--dark">
                <PatternScreen lang={lang} />
              </PhoneFrame>
            </div>
          </div>
          <div className="flow" aria-hidden>
            <div className="flow__track">
              {[...c.patterns.flags, ...c.patterns.flags].map((f, i) => (
                <span key={i} className="flow__chip">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section surface-panel">
          <div className="wrap">
            <header className="section__head">
              <h2 className="h2" data-reveal>
                {c.features.title}
              </h2>
            </header>
            <div className="cards">
              {c.features.items.map((f, i) => (
                <article key={f.key} className="card" data-reveal style={{ transitionDelay: `${(i % 2) * 0.08}s` }}>
                  <span className="card__icon">{FEATURE_ICONS[f.key]}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privasi" className="section surface-white">
          <div className="wrap">
            <header className="section__head">
              <h2 className="h2" data-reveal>
                {c.privacy.title}
              </h2>
              <p className="lead" data-reveal>
                {c.privacy.lead}
              </p>
            </header>
            <div className="cards cards--plain">
              {c.privacy.cards.map((p, i) => (
                <article key={p.title} className="card card--line" data-reveal style={{ transitionDelay: `${(i % 2) * 0.08}s` }}>
                  <span className="card__lock">🔒</span>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="harga" className="section surface-panel">
          <div className="wrap">
            <header className="section__head">
              <h2 className="h2" data-reveal>
                {c.pricing.title}
              </h2>
              <p className="lead" data-reveal>
                {c.pricing.lead}
              </p>
            </header>
            <div className="prices">
              {[c.pricing.free, c.pricing.premium].map((p, i) => (
                <article key={p.name} className={`price ${i === 1 ? "price--hi" : ""}`} data-reveal style={{ transitionDelay: `${i * 0.1}s` }}>
                  {"badge" in p && <span className="price__badge">{(p as typeof c.pricing.premium).badge}</span>}
                  <h3>{p.name}</h3>
                  <p className="price__amt">
                    <b>{p.price}</b> <span>{p.per}</span>
                  </p>
                  <ul>
                    {p.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                  <a href={APP_URL} className={`pill ${i === 1 ? "pill--peach" : "pill--ghost"}`}>
                    {p.cta}
                  </a>
                </article>
              ))}
            </div>
            <p className="fine center">{c.pricing.note}</p>
          </div>
        </section>

        {/* Closing */}
        <section className="closing surface-white">
          <div className="wrap center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sites/scanything/icon.svg" alt="" width={96} height={96} className="closing__logo" data-reveal />
            <h2 className="h2" data-reveal>
              {c.closing.title}
            </h2>
            <p className="lead" data-reveal>
              {c.closing.lead}
            </p>
            <a href={APP_URL} className="pill pill--lg closing__cta" data-reveal>
              {c.closing.cta}
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section surface-dark">
          <div className="wrap">
            <h2 className="h2" data-reveal>
              {c.faq.title}
            </h2>
            <div className="faq">
              {c.faq.items.map((f, i) => {
                const open = faq === i;
                return (
                  <div key={f.q} className={`faq__item ${open ? "is-open" : ""}`}>
                    <button className="faq__q" aria-expanded={open} onClick={() => setFaq(open ? null : i)}>
                      {f.q}
                      <span className="faq__plus" aria-hidden />
                    </button>
                    <div className="faq__a">
                      <p>{f.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer surface-dark">
        <div className="wrap">
          <Logo dark />
          <p className="site-footer__tag">{c.footer.tagline}</p>
          <div className="site-footer__cols">
            {c.footer.cols.map((col) => (
              <div key={col.title}>
                <h4>{col.title}</h4>
                {col.links.map(([l, h]) => (
                  <a key={l} href={h}>
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <p className="fine fine--dark">{c.footer.disclaimer}</p>
          <p className="fine fine--dark">© {new Date().getFullYear()} Scanything</p>
        </div>
      </footer>
    </>
  );
}
