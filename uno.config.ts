import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";
import transformerDirectives from "@unocss/transformer-directives";
import { THEME_CONFIG } from "./src/theme.config";

const {socials, themeStyle} = THEME_CONFIG;

let foreground = "#2e405b";
let background = "#ffffff";

if(THEME_CONFIG.themeStyle === 'dark') {
  foreground = "#ffffff";
  background = "#2e405b";
}

export default defineConfig({
  presets: [
    presetUno({
      dark: themeStyle === 'auto' ? 'media' : 'class',
    }),
    presetAttributify({ nonValuedAttribute: true }),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    colors: {
      foreground,
      background
    },
    fontFamily: {
      // Latin/digits render in Inter (a refined, even-weight webfont) instead of an
      // uncontrolled heavy system fallback; Inter carries no Han glyphs, so Chinese
      // falls through to LXGW WenKai — warm voice for prose, sharp technical tokens.
      sans: '"Inter Variable",-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Helvetica Neue","Helvetica","Arial","LXGW WenKai","Source Han Sans SC","Source Han Sans TC","PingFang SC","PingFang HK","PingFang TC",sans-serif',
      mono: '"Maple Mono NF CN","SFMono-Regular",consolas,"Liberation Mono",menlo,courier,monospace',
      serif: '"HiraMinProN-W6","Source Han Serif CN","Source Han Serif SC","Source Han Serif TC",serif',
    },
    animation: {
      keyframes: {
        "fadein-down":
          "{from {opacity: 0.1;transform: translateY(-20px);}to {opacity: 1;transform: translateY(0);}}",
        "fadein-left":
          "{from {opacity: 0.1;transform: translateX(20px);}to {opacity: 1;transform: translateX(0);}}",
      },
    },
  },
  shortcuts: [
    ['icon', 'inline-block '],
    ['post-title', 'text-5 font-bold lh-7.5 m-0'],
  ],
  transformers: [
    transformerDirectives(),
  ],
  safelist: [
    ...socials.map((social) => `i-mdi-${social.name}`),
    'i-mdi-content-copy',
    'i-mdi-check',
    'i-mdi-play',
    'i-mdi-pause',
  ],
})
