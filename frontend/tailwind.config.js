import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
              "surface-variant": "#2e3447",
              "on-background": "#dce1fb",
              "on-secondary-container": "#5b3800",
              "on-error": "#690005",
              "surface-bright": "#33394c",
              "surface-dim": "#0c1324",
              "on-primary-fixed": "#00201c",
              "on-secondary": "#472a00",
              "secondary-fixed": "#ffddb8",
              "on-tertiary-fixed-variant": "#930013",
              "surface-container-highest": "#2e3447",
              "on-primary-fixed-variant": "#005047",
              "on-tertiary": "#68000a",
              "primary-fixed-dim": "#3cddc7",
              "tertiary": "#ffceca",
              "inverse-surface": "#dce1fb",
              "on-tertiary-fixed": "#410004",
              "primary-fixed": "#62fae3",
              "surface-container-low": "#151b2d",
              "secondary": "#ffb95f",
              "on-secondary-fixed-variant": "#653e00",
              "surface-container": "#191f31",
              "surface-tint": "#3cddc7",
              "primary-container": "#2dd4bf",
              "on-surface": "#dce1fb",
              "on-surface-variant": "#bacac5",
              "error-container": "#93000a",
              "primary": "#57f1db",
              "surface-container-lowest": "#070d1f",
              "error": "#ffb4ab",
              "on-primary": "#003731",
              "background": "#0c1324",
              "surface-container-high": "#23293c",
              "on-error-container": "#ffdad6",
              "on-secondary-fixed": "#2a1700",
              "outline-variant": "#3c4a46",
              "on-tertiary-container": "#9e0016",
              "tertiary-fixed-dim": "#ffb3ad",
              "outline": "#859490",
              "tertiary-fixed": "#ffdad7",
              "surface": "#0c1324",
              "tertiary-container": "#ffa7a0",
              "secondary-container": "#ee9800",
              "inverse-primary": "#006b5f",
              "on-primary-container": "#00574d",
              "inverse-on-surface": "#2a3043",
              "secondary-fixed-dim": "#ffb95f"
      },
      borderRadius: {
              "DEFAULT": "0.125rem",
              "lg": "0.25rem",
              "xl": "0.5rem",
              "full": "0.75rem"
      },
      spacing: {
              "unit": "4px",
              "container-max": "1440px",
              "gutter": "16px",
              "margin-mobile": "16px",
              "margin-desktop": "32px"
      },
      fontFamily: {
              "body-md": ["Space Grotesk", "sans-serif"],
              "label-caps": ["Space Grotesk", "sans-serif"],
              "headline-lg": ["Space Grotesk", "sans-serif"]
      },
      fontSize: {
              "body-md": ["16px", {"lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400"}],
              "label-caps": ["12px", {"lineHeight": "1", "letterSpacing": "0.15em", "fontWeight": "600"}],
              "headline-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700"}]
      }
    },
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
