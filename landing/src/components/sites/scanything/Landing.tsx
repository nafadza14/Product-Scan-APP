"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { APP_URL, COPY, type Lang } from "./content";
import { AppClip, PhoneFrame, type Clip } from "./Phones";
import { IOS_EASE, RISE_EASE, reveal, rise, sheetTransition, softSpring, stagger } from "./motion";

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

/** Pill link with the app's press feedback (scale 0.96 on a soft spring). */
function Pill({ href, className = "", children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <motion.a href={href} className={`pill ${className}`} whileTap={{ scale: 0.96 }} transition={softSpring}>
      {children}
    </motion.a>
  );
}

const TAB_CLIPS: Clip[] = ["scan", "skin", "meal", "plan"];
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
  const tabsVisible = useInView(tabsRef, { amount: 0.4 });

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

  // Tabs advance while visible, timed to each recording, until the visitor picks one.
  useEffect(() => {
    if (!auto || !tabsVisible) return;
    const durations = [10000, 10500, 6400, 9000];
    const id = window.setTimeout(() => setTab((x) => (x + 1) % 4), durations[tab]);
    return () => window.clearTimeout(id);
  }, [auto, tabsVisible, tab]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const navLinks: [string, string][] = [
    [c.nav.how, "#cara"],
    [c.nav.skin, "#kulit"],
    [c.nav.patterns, "#pola"],
    [c.nav.privacy, "#privasi"],
    [c.nav.pricing, "#harga"],
    [c.nav.faq, "#faq"],
  ];
  const durations = [10000, 10500, 6400, 9000];

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
            <Pill href={APP_URL} className="pill--sm">
              {c.cta}
            </Pill>
            <button className={`burger ${menu ? "is-open" : ""}`} onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label={menu ? c.close : c.menu}>
              <i />
              <i />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.div className="sheet" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: IOS_EASE }}>
              <motion.nav className="wrap sheet__nav" variants={stagger} initial="hidden" animate="show">
                {navLinks.map(([l, h]) => (
                  <motion.a key={h} href={h} onClick={() => setMenu(false)} variants={rise}>
                    {l}
                  </motion.a>
                ))}
                <motion.div variants={rise}>
                  <Pill href={APP_URL} className="pill--lg">
                    {c.cta}
                  </Pill>
                </motion.div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="main">
        {/* Hero: same entrance as the app's home screen */}
        <section id="top" className="hero surface-white">
          <motion.div className="wrap hero__inner" variants={stagger} initial="hidden" animate="show" key={`hero-${lang}`}>
            <motion.h1 className="hero__title" variants={rise}>
              <span>{c.hero.title[0]}</span>
              <span className="hero__accent">{c.hero.title[1]}</span>
            </motion.h1>
            <motion.p className="lead hero__lead" variants={rise}>
              {c.hero.lead}
            </motion.p>
            <motion.div className="hero__ctas" variants={rise}>
              <Pill href={APP_URL} className="pill--lg">
                {c.hero.primary}
              </Pill>
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
            </motion.div>
          </motion.div>
          <motion.div className="hero__stage" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sheetTransition, delay: 0.35 }}>
            <div className="hero__orb" aria-hidden />
            <PhoneFrame className="hero__phone">
              <AppClip clip="today" lang={lang} eager label={c.hero.title.join(" ")} />
            </PhoneFrame>
          </motion.div>
        </section>

        {/* How it works: segmented control and clips, like the app's Segmented + sheet */}
        <section id="cara" className="section surface-panel">
          <div className="wrap">
            <header className="section__head">
              <motion.h2 className="h2" {...reveal(0)}>
                {c.how.title}
              </motion.h2>
              <motion.p className="lead" {...reveal(1)}>
                {c.how.lead}
              </motion.p>
            </header>
            <div className="tabs" ref={tabsRef}>
              <motion.div className="seg" role="tablist" aria-label={c.nav.how} {...reveal(2)}>
                {c.how.tabs.map((tb, i) => {
                  const on = tab === i;
                  return (
                    <button
                      key={tb.key}
                      role="tab"
                      aria-selected={on}
                      className={on ? "is-on" : ""}
                      onClick={() => {
                        setAuto(false);
                        setTab(i);
                      }}
                    >
                      {on && <motion.span layoutId="seg-bubble" className="seg__bubble" transition={softSpring} />}
                      <span className="seg__label">{tb.label}</span>
                      {on && auto && tabsVisible && (
                        <motion.span
                          key={`p${i}`}
                          className="seg__progress"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: durations[i] / 1000, ease: "linear" }}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
              <div className="tabs__body">
                <motion.div {...reveal(3)}>
                  <PhoneFrame className="tabs__phone">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={`${TAB_CLIPS[tab]}-${lang}`}
                        className="phone__layer"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ scale: 0.92, opacity: 0.4, filter: "brightness(0.9)" }}
                        transition={sheetTransition}
                      >
                        <AppClip clip={TAB_CLIPS[tab]} lang={lang} label={c.how.tabs[tab].title} />
                      </motion.div>
                    </AnimatePresence>
                  </PhoneFrame>
                </motion.div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`t${tab}-${lang}`}
                    className="tabs__copy"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: RISE_EASE }}
                  >
                    <span className="stat">{c.how.tabs[tab].stat}</span>
                    <span className="stat__sub">{c.how.tabs[tab].statSub}</span>
                    <h3>{c.how.tabs[tab].title}</h3>
                    <p>{c.how.tabs[tab].body}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* For your skin */}
        <section id="kulit" className="section surface-white">
          <div className="wrap split">
            <div>
              <motion.span className="eyebrow" {...reveal(0)}>
                {c.skin.eyebrow}
              </motion.span>
              <motion.h2 className="h2" {...reveal(1)}>
                {c.skin.title}
              </motion.h2>
              <motion.p className="lead" {...reveal(2)}>
                {c.skin.lead}
              </motion.p>
              <ul className="checks">
                {c.skin.points.map((p, i) => (
                  <motion.li key={p} {...reveal(3 + i)}>
                    <span className="checks__dot">✓</span>
                    {p}
                  </motion.li>
                ))}
              </ul>
            </div>
            <motion.div className="split__visual" {...reveal(2)}>
              <PhoneFrame>
                <AppClip clip="scan" lang={lang} still label={c.skin.title} />
              </PhoneFrame>
            </motion.div>
          </div>
        </section>

        {/* Patterns */}
        <section id="pola" className="section surface-dark">
          <div className="wrap split">
            <div>
              <motion.span className="eyebrow" {...reveal(0)}>
                {c.patterns.eyebrow}
              </motion.span>
              <motion.h2 className="h2" {...reveal(1)}>
                {c.patterns.title}
              </motion.h2>
              <motion.p className="lead lead--dark" {...reveal(2)}>
                {c.patterns.lead}
              </motion.p>
              <ul className="insights">
                {c.patterns.insights.map((i, k) => (
                  <motion.li key={i.text} {...reveal(3 + k)}>
                    <span className={`insights__delta ${i.delta.startsWith("+") ? "up" : "down"}`}>{i.delta}</span>
                    {i.text}
                  </motion.li>
                ))}
              </ul>
              <p className="fine fine--dark">{c.patterns.note}</p>
            </div>
            <motion.div className="split__visual" {...reveal(2)}>
              <PhoneFrame>
                <AppClip clip="progress" lang={lang} label={c.patterns.title} />
              </PhoneFrame>
            </motion.div>
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
              <motion.h2 className="h2" {...reveal(0)}>
                {c.features.title}
              </motion.h2>
            </header>
            <div className="cards">
              {c.features.items.map((f, i) => (
                <motion.article key={f.key} className="card" {...reveal(i % 2)} whileTap={{ scale: 0.98 }}>
                  <span className="card__icon">{FEATURE_ICONS[f.key]}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privasi" className="section surface-white">
          <div className="wrap">
            <header className="section__head">
              <motion.h2 className="h2" {...reveal(0)}>
                {c.privacy.title}
              </motion.h2>
              <motion.p className="lead" {...reveal(1)}>
                {c.privacy.lead}
              </motion.p>
            </header>
            <div className="cards">
              {c.privacy.cards.map((p, i) => (
                <motion.article key={p.title} className="card card--mist" {...reveal(i % 2)}>
                  <span className="card__lock">🔒</span>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing: mirrors the app's paywall options */}
        <section id="harga" className="section surface-panel">
          <div className="wrap">
            <header className="section__head">
              <motion.h2 className="h2" {...reveal(0)}>
                {c.pricing.title}
              </motion.h2>
              <motion.p className="lead" {...reveal(1)}>
                {c.pricing.lead}
              </motion.p>
            </header>
            <div className="prices">
              {[c.pricing.free, c.pricing.premium].map((p, i) => (
                <motion.article key={p.name} className={`price ${i === 1 ? "price--hi" : ""}`} {...reveal(i)}>
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
                  <Pill href={APP_URL} className={i === 1 ? "pill--peach" : "pill--ghost"}>
                    {p.cta}
                  </Pill>
                </motion.article>
              ))}
            </div>
            <p className="fine center">{c.pricing.note}</p>
          </div>
        </section>

        {/* Closing: the app's splash pulse */}
        <section className="closing surface-white">
          <div className="wrap center">
            <motion.img
              src="/sites/scanything/icon.svg"
              alt=""
              width={96}
              height={96}
              className="closing__logo"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: [1, 1.05, 1] }}
              viewport={{ once: false, amount: 0.6 }}
              transition={{ scale: { duration: 1.4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.4 } }}
            />
            <motion.h2 className="h2" {...reveal(1)}>
              {c.closing.title}
            </motion.h2>
            <motion.p className="lead" {...reveal(2)}>
              {c.closing.lead}
            </motion.p>
            <motion.div {...reveal(3)} className="closing__cta">
              <Pill href={APP_URL} className="pill--lg">
                {c.closing.cta}
              </Pill>
            </motion.div>
          </div>
        </section>

        {/* FAQ: expands like the app's full ingredient list */}
        <section id="faq" className="section surface-dark">
          <div className="wrap">
            <motion.h2 className="h2" {...reveal(0)}>
              {c.faq.title}
            </motion.h2>
            <div className="faq">
              {c.faq.items.map((f, i) => {
                const open = faq === i;
                return (
                  <div key={f.q} className="faq__item">
                    <button className="faq__q" aria-expanded={open} onClick={() => setFaq(open ? null : i)}>
                      {f.q}
                      <motion.span className="faq__chev" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease: IOS_EASE }} aria-hidden>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          className="faq__a"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: IOS_EASE }}
                        >
                          <p>{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
          <p className="fine fine--dark">© {new Date().getFullYear()} Scanything · Zieara Technology (PT. Bantu Indonesia Technology)</p>
        </div>
      </footer>
    </>
  );
}
