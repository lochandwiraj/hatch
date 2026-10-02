/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Not `extend`: the default palette, radius and shadow scales are removed
    // on purpose. bg-purple-500, rounded-lg and shadow-md must not resolve.
    screens: {
      md: '768px',
      lg: '1024px',
      xl: '1440px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ink: {
        DEFAULT: 'var(--ink)',
        raised: 'var(--ink-raised)',
        sunken: 'var(--ink-sunken)',
      },
      rule: {
        DEFAULT: 'var(--rule)',
        strong: 'var(--rule-strong)',
      },
      type: {
        primary: 'var(--type-primary)',
        secondary: 'var(--type-secondary)',
        muted: 'var(--type-muted)',
      },
      signal: {
        DEFAULT: 'var(--signal)',
        press: 'var(--signal-press)',
      },
      verified: 'var(--verified)',
      deadline: 'var(--deadline)',
      locked: 'var(--locked)',
      cat: {
        hackathon: 'var(--cat-hackathon)',
        networking: 'var(--cat-networking)',
        conference: 'var(--cat-conference)',
        webinar: 'var(--cat-webinar)',
        other: 'var(--cat-other)',
        fallback: 'var(--cat-fallback)',
      },
    },
    // 4px base. These are the only spacing values in the codebase.
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
      16: '64px',
      24: '96px',
      32: '128px',
      48: '192px',
      px: '1px',
      full: '100%',
    },
    borderRadius: {
      none: '0',
      DEFAULT: '0',
    },
    boxShadow: {
      none: 'none',
    },
    borderWidth: {
      0: '0',
      DEFAULT: '1px',
      2: '2px',
    },
    fontFamily: {
      // Qepho is intentionally absent here. It is applied only through the
      // .font-qepho utility in globals.css, which the Hatch component uses.
      display: ['var(--font-barlow-condensed)', 'ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
      sans: ['var(--font-public-sans)', 'ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
      serif: ['var(--font-source-serif)', 'ui-serif', 'Georgia', 'serif'],
      mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    fontSize: {
      'display-xl': ['clamp(44px, 13vw, 132px)', { lineHeight: '0.88', letterSpacing: '-0.02em', fontWeight: '800' }],
      'display-l': ['clamp(34px, 8vw, 84px)', { lineHeight: '0.92', letterSpacing: '-0.01em', fontWeight: '800' }],
      'display-m': ['clamp(26px, 5vw, 52px)', { lineHeight: '0.96', letterSpacing: '0.01em', fontWeight: '700' }],
      title: ['clamp(19px, 3vw, 28px)', { lineHeight: '1.06', letterSpacing: '0.01em', fontWeight: '700' }],
      'body-l': ['clamp(17px, 1.4vw, 19px)', { lineHeight: '1.62' }],
      body: ['16px', { lineHeight: '1.58' }],
      ui: ['15px', { lineHeight: '1.35' }],
      'ui-s': ['13px', { lineHeight: '1.3' }],
      label: ['11px', { lineHeight: '1.1', letterSpacing: '0.14em', fontWeight: '600' }],
      mono: ['13px', { lineHeight: '1.25' }],
      'mono-l': ['clamp(22px, 4vw, 40px)', { lineHeight: '1.1', fontWeight: '500' }],
    },
    extend: {
      transitionTimingFunction: {
        enter: 'var(--ease-enter)',
        exit: 'var(--ease-exit)',
        move: 'var(--ease-move)',
      },
      transitionDuration: {
        micro: '110ms',
        state: '220ms',
        enter: '420ms',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      // Reading measure. Never set a text column wider than these.
      maxWidth: {
        measure: '68ch',
        tight: '62ch',
      },
    },
  },
  plugins: [],
}
