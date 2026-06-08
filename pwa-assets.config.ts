import {
  createAppleSplashScreens,
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  images: ['public/logo.svg'],
  preset: {
    ...preset,
    transparent: {
      ...preset.transparent,
      padding: 0,
      resizeOptions: {
        ...preset.transparent.resizeOptions,
        fit: 'contain',
        background: {
          r: 0,
          g: 0,
          b: 0,
          alpha: 0,
        },
      },
    },
    maskable: {
      ...preset.maskable,
      padding: 0.3,
      resizeOptions: {
        ...preset.maskable.resizeOptions,
        fit: 'contain',
        background: '#10002F',
        position: 'bottom',
      },
    },
    apple: {
      ...preset.apple,
      padding: 0.1,
      resizeOptions: {
        ...preset.apple.resizeOptions,
        fit: 'contain',
        background: '#10002F',
        position: 'bottom',
      },
    },
    appleSplashScreens: createAppleSplashScreens({
      resizeOptions: {
        background: '#10002F',
      },
      darkResizeOptions: {
        background: '#10002F',
      },
    }),
  },
});
