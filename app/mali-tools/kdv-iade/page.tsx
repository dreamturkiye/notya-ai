import { redirect } from 'next/navigation'

/** Legacy empty route — send users to the live GİB e-Beyan tool. */
export default function KdvIadeRedirect() {
  redirect('/mali-tools/ebeyan')
}
