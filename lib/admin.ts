/**
 * Who may open an admin screen.
 *
 * This lived in five places: once per admin page and once in the Header, and
 * the Header's copy had drifted to lowercase `dwiraj@hatch.in` while the pages
 * carried `dwiraj@HATCH.in`. Since the check is a case-sensitive array
 * include, the two lists did not agree on who was an administrator — the nav
 * could show admin links to an address the pages would refuse, or the reverse.
 *
 * It is a plain module rather than part of AdminUI because AdminUI renders the
 * Header, so the Header cannot import from it without a cycle.
 *
 * Two notes for whoever owns this list: the `@HATCH.in` domain is not the live
 * one — the product runs on hatchevent.in — so only the two Gmail addresses
 * actually grant access today. Comparison is lowercased now, so case in the
 * list no longer decides anything.
 */
export const ADMIN_EMAILS = [
  'dwiraj06@gmail.com',
  'pokkalilochan@gmail.com',
  'dwiraj@HATCH.in',
  'lochan@HATCH.in',
] as const

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return ADMIN_EMAILS.some((a) => a.toLowerCase() === normalized)
}
