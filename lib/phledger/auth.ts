// lib/phledger/auth.ts -- PHledger admin authentication for marketing & finance.
// Credentials are read from environment variables ONLY (never committed):
//   PHLEDGER_ADMIN_EMAIL, PHLEDGER_ADMIN_PASSWORD
export interface AdminCredentials { email: string; password: string }

export function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.PHLEDGER_ADMIN_EMAIL
  const password = process.env.PHLEDGER_ADMIN_PASSWORD
  if (!email || !password) return null
  return { email, password }
}

export function isPhledgerAdmin(email?: string, password?: string): boolean {
  const cfg = getAdminCredentials()
  if (!cfg || !email || !password) return false
  return email.trim().toLowerCase() === cfg.email.toLowerCase() && password === cfg.password
}
