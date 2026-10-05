/**
 * Where an account belongs after signing in.
 *
 * Every sign-in path pushed to /dashboard, so a college account landed on the
 * student dashboard — greeted by name, offered a subscription and a cap meter
 * it does not have. The role is not known at the moment the redirect fires,
 * because the profile is still loading, so the dashboard itself also sends a
 * college on to /college. This keeps the two in agreement.
 */
export function homePathForRole(role: string | null | undefined): string {
  return role === 'college' ? '/college' : '/dashboard'
}
