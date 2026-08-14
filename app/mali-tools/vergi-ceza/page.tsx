import { redirect } from 'next/navigation'

/** Legacy empty route — send users to the live vergi cezası calculator. */
export default function VergiCezaRedirect() {
  redirect('/mali-tools/vergi-cezasi')
}
