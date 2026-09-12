import type { Config } from "tailwindcss";
const withMT = require("@material-tailwind/react/utils/withMT");
const {
  slate,
  zinc,
  neutral,
  stone,
  red,
  orange,
  amber,
  yellow,
  lime,
  green,
  emerald,
  teal,
  cyan,
  sky,
  blue,
  indigo,
  violet,
  purple,
  fuchsia,
  pink,
  rose,
} = require("tailwindcss/colors");

const config: Config = withMT({
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate,
        zinc,
        neutral,
        stone,
        red,
        orange,
        amber,
        yellow,
        lime,
        green,
        emerald,
        teal,
        cyan,
        sky,
        blue,
        indigo,
        violet,
        purple,
        fuchsia,
        pink,
        rose,
      },
    },
  },
  plugins: [],
});

export default config;
