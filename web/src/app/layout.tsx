// Pass-through root layout: html/body are owned by [locale]/layout.tsx
// which is the effective root layout for all locale-prefixed routes.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
