/** Isolated compile for /doktor and /klinik — Next production was shipping raw @tailwind. */
module.exports = {
  important: ".doktor-lp",
  corePlugins: { preflight: false },
  content: [
    "./app/doktor/**/*.{js,ts,jsx,tsx}",
    "./components/doktor-landing/**/*.{js,ts,jsx,tsx}",
    // NOTYA-KLINIK-01: /klinik shares the compiled stylesheet (same .doktor-lp scope). Any page
    // importing app/doktor/utilities.css MUST be listed here, or its classes silently vanish
    // from the compiled output and the page ships half-styled — the exact bug this file fixed.
    "./app/klinik/**/*.{js,ts,jsx,tsx}",
    "./components/klinik-landing/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f3f6f5",
        "paper-2": "#e4eeeb",
        ink: "#102428",
        "ink-2": "#1d3c42",
        "ink-muted": "#5a7176",
        pine: "#0e6b66",
        "pine-2": "#0b5551",
        cream: "#ffffff",
        line: "#1024281a",
        warn: "#9a3d32",
      },
      fontFamily: {
        display: ['var(--font-fraunces)', "Georgia", "Times New Roman", "serif"],
        outfit: ['var(--font-outfit-face)', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["clamp(2.45rem, 5.2vw, 5.15rem)", { lineHeight: "1.05", letterSpacing: "-0.035em" }],
        display: ["clamp(1.85rem, 4.2vw, 4.05rem)", { lineHeight: "1.12", letterSpacing: "-0.03em" }],
        title: ["clamp(1.45rem, 2.6vw, 2.35rem)", { lineHeight: "1.25" }],
        lede: ["clamp(1.05rem, 1.3vw, 1.25rem)", { lineHeight: "1.65" }],
      },
      lineHeight: { hero: "1.05", display: "1.12" },
      letterSpacing: { hero: "-0.035em", display: "-0.03em" },
      boxShadow: {
        border: "0 0 0 1px #10242814, 0 1px 2px -1px #10242810, 0 10px 28px -16px #10242822",
      },
    },
  },
};
