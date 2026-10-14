// Motion tokens copied from the app (components/ui.tsx in app.scanything.online) so the landing moves the same way.
export const IOS_EASE = [0.32, 0.72, 0, 1] as const;
export const RISE_EASE = [0.16, 1, 0.3, 1] as const;
export const pushTransition = { type: "tween", ease: IOS_EASE, duration: 0.5 } as const;
export const sheetTransition = { type: "spring", stiffness: 380, damping: 40, mass: 1 } as const;
export const softSpring = { type: "spring", stiffness: 500, damping: 34 } as const;

/** Home screen entrance: children rise 14px with a 0.06s stagger. */
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
export const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: RISE_EASE } } };

/** Result screen reveal: each block rises 18px, 0.07s apart. */
export const reveal = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -10% 0px" },
  transition: { duration: 0.55, delay: 0.05 + i * 0.07, ease: RISE_EASE },
});
