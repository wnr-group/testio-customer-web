// Public layout — no auth required. No navbar.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
