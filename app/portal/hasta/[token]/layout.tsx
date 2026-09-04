import { HastaShell } from './HastaShell'

export default function HastaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { token: string }
}) {
  return <HastaShell token={params.token}>{children}</HastaShell>
}
