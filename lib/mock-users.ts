export interface MockUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

// Pre-computed: bcryptjs.hashSync("demo1234", 10)
// NEVER call hashSync at module scope -- it blocks the event loop for seconds
const DEMO_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// In-memory user store (resets on server restart)
const users: MockUser[] = [
  {
    id: "user-1",
    name: "Demo User",
    email: "demo@vatici.com",
    passwordHash: DEMO_HASH,
    createdAt: "2026-01-15T10:00:00Z",
  },
]

export function findUserByEmail(email: string): MockUser | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function createUser(data: {
  name: string
  email: string
  passwordHash: string
}): MockUser {
  const newUser: MockUser = {
    id: `user-${Date.now()}`,
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  return newUser
}
