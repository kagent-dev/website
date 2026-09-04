import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			// Solo.io brand type: Figtree for display, DM Sans for body, DM Mono for labels/code.
  			display: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			body: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  		},
  		keyframes: {
  			'kg-caret': { '0%, 49%': { opacity: '1' }, '50%, 100%': { opacity: '0' } },
  			'kg-sweep': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(400%)' } },
  			'kg-pulse': { '0%, 100%': { opacity: '.35' }, '50%': { opacity: '1' } },
  			'kg-rise': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  		},
  		animation: {
  			'kg-caret': 'kg-caret 1.1s steps(1) infinite',
  			'kg-sweep': 'kg-sweep 1.6s cubic-bezier(.2,.6,.2,1) infinite',
  			'kg-pulse': 'kg-pulse 2.4s ease-in-out infinite',
  			'kg-rise': 'kg-rise 400ms cubic-bezier(.16,1,.3,1) both',
  		},
  		transitionDuration: {
  			'400': '400ms',
  			'600': '600ms',
  		},
  		transitionTimingFunction: {
  			standard: 'cubic-bezier(.2,.6,.2,1)',
  			'out-expo': 'cubic-bezier(.16,1,.3,1)',
  		},
  		colors: {
  			// Redesign tokens — CSS variables defined in globals.css (:root light, .dark dark).
  			kg: {
  				pg: 'var(--kg-pg)',
  				panel: 'var(--kg-panel)',
  				tx1: 'var(--kg-tx1)',
  				tx2: 'var(--kg-tx2)',
  				tx3: 'var(--kg-tx3)',
  				tx4: 'var(--kg-tx4)',
  				bd: 'var(--kg-bd)',
  				'bd-soft': 'var(--kg-bd-soft)',
  				sf: 'var(--kg-sf)',
  				acc: 'var(--kg-acc)',
  				brand: '#8B2FE8',
  				nav: 'var(--kg-nav)',
  				term: 'var(--kg-term)',
  				'term-tx': 'var(--kg-term-tx)',
  				'term-dim': 'var(--kg-term-dim)',
  				ykey: 'var(--kg-ykey)',
  				yval: 'var(--kg-yval)',
  				ystr: 'var(--kg-ystr)',
  				ycom: 'var(--kg-ycom)',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		typography: {
  			DEFAULT: {
  				css: {
  					// The typography plugin wraps inline <code> in literal backtick
  					// characters via ::before/::after. We render our own styled
  					// <code>, so strip them.
  					'code::before': { content: '""' },
  					'code::after': { content: '""' }
  				}
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
