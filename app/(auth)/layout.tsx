// Authenticated layout — proxy.ts enforces auth before this runs.
import { Navbar } from '@/components/layout/Navbar'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
