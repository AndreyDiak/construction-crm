import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: 'brand',
    },
    body: {
      bg: 'bg.app',
      color: 'fg',
      fontFamily: 'body',
      lineHeight: '1.5',
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: {
          value: `'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif`,
        },
        body: {
          value: `'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif`,
        },
      },
      radii: {
        l1: { value: '0.375rem' },
        l2: { value: '0.625rem' },
        l3: { value: '0.875rem' },
      },
      colors: {
        gray: {
          50: { value: '#f7f8f8' },
          100: { value: '#eef0f0' },
          200: { value: '#dde2e2' },
          300: { value: '#c5cdcd' },
          400: { value: '#97a3a3' },
          500: { value: '#6b7878' },
          600: { value: '#526060' },
          700: { value: '#3f4b4b' },
          800: { value: '#2c3535' },
          900: { value: '#1c2323' },
          950: { value: '#111616' },
        },
        brand: {
          50: { value: '#f2f9f8' },
          100: { value: '#dcefed' },
          200: { value: '#b8ddd9' },
          300: { value: '#8bc5c0' },
          400: { value: '#5aa8a2' },
          500: { value: '#3d8b85' },
          600: { value: '#2f6f6b' },
          700: { value: '#285956' },
          800: { value: '#234846' },
          900: { value: '#1f3c3b' },
          950: { value: '#0d2221' },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          app: { value: '{colors.gray.50}' },
          canvas: { value: '{colors.gray.100}' },
          surface: { value: 'white' },
          muted: { value: '{colors.gray.100}' },
        },
        border: {
          subtle: { value: '{colors.gray.200}' },
          muted: { value: '{colors.gray.300}' },
        },
        brand: {
          solid: { value: '{colors.brand.600}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.brand.700}' },
          muted: { value: '{colors.brand.100}' },
          subtle: { value: '{colors.brand.50}' },
          emphasized: { value: '{colors.brand.200}' },
          focusRing: { value: '{colors.brand.500}' },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
