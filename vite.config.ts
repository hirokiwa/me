import { defineConfig, type HtmlTagDescriptor } from 'vite';

const googleTagId = 'G-D598T36NNK';

const googleTagScripts: HtmlTagDescriptor[] = [
  {
    tag: 'script',
    attrs: {
      async: true,
      src: `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`,
    },
    injectTo: 'head',
  },
  {
    tag: 'script',
    children: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${googleTagId}');
    `,
    injectTo: 'head',
  },
];

export default defineConfig(({ command }) => ({
  plugins: [
    {
      name: 'inject-google-tag-on-build',
      transformIndexHtml() {
        if (command !== 'build') {
          return undefined;
        }

        return googleTagScripts;
      },
    },
  ],
}));
