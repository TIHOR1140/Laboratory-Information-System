const TOKEN_KEY = 'lis_auth_token'
const USER_KEY = 'lis_auth_user'

export function saveSession(session, rememberMe = true) {
  const storage = rememberMe ? localStorage : sessionStorage
  const otherStorage = rememberMe ? sessionStorage : localStorage

  otherStorage.removeItem(TOKEN_KEY)
  otherStorage.removeItem(USER_KEY)

  storage.setItem(TOKEN_KEY, session.token)
  storage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function loadSession() {
  const storages = [localStorage, sessionStorage]

  for (const storage of storages) {
    const token = storage.getItem(TOKEN_KEY)
    const user = storage.getItem(USER_KEY)

    if (token && user) {
      return {
        token,
        user: JSON.parse(user),
      }
    }
  }

  return null
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function getDashboardPath(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'RECEPTIONIST':
      return '/reception/dashboard'
    case 'TECHNICIAN':
      return '/lab/dashboard'
    default:
      return '/patient/dashboard'
  }
}