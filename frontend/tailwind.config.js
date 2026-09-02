/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Government & Sovereign Brand Colors
        gov: {
          navy: "#0F2A4A",
          ashoka: "#0B3C68",
          saffron: "#FF9933",
          saffronDark: "#D97706",
          emerald: "#138808",
          emeraldDark: "#059669",
          slateDark: "#0B1528",
          border: "#E2E8F0",
          cardLight: "#FFFFFF",
          cardDark: "#111C33",
          bgLight: "#F8FAFC",
          bgDark: "#070E1B"
        },
        // CPCB Standard AQI Categories
        cpcb: {
          good: "#00B050",         // 0-50
          satisfactory: "#92D050", // 51-100
          moderate: "#E5A900",     // 101-200
          poor: "#E36414",         // 201-300
          veryPoor: "#D90429",     // 301-400
          severe: "#7A0026",       // 401-500
        },
        // Legacy dark shades
        dark: {
          950: "#070E1B",
          900: "#0B1528",
          800: "#111C33",
          700: "#1E2C48",
          600: "#334155",
        },
        brand: {
          cyan: "#0284C7",
          blue: "#1D4ED8",
          indigo: "#4F46E5",
          emerald: "#059669"
        },
        // AIRNEXUS 26082 Warm Sand & Forest Design System
        airnexus: {
          sand: "#EFECE6",
          sandLight: "#F5F2EC",
          sandDark: "#E5E1D8",
          sidebar: "#1B241E",
          sidebarLight: "#243028",
          sidebarActive: "#F3EFE6",
          card: "#FCFAF7",
          cardWhite: "#FFFFFF",
          border: "#E4DFD5",
          borderDark: "#D8D2C6",
          text: "#1C201C",
          textMuted: "#666D67",
          textLight: "#9BA39C",
          pillGreen: "#2E7D47",
          pillBurgundy: "#7A1B22",
          badgeDark: "#27332A"
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'gov': '0 1px 3px 0 rgba(15, 42, 74, 0.08), 0 1px 2px -1px rgba(15, 42, 74, 0.08)',
        'gov-md': '0 4px 6px -1px rgba(15, 42, 74, 0.1), 0 2px 4px -2px rgba(15, 42, 74, 0.1)',
        'gov-lg': '0 10px 15px -3px rgba(15, 42, 74, 0.1), 0 4px 6px -4px rgba(15, 42, 74, 0.1)',
      }
    },
  },
  plugins: [],
}
