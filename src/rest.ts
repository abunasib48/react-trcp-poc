/**
 * TRANSPORT A - REST, over plain `fetch`.
 *
 * Deliberately untyped end to end. `RestUser` below is hand-written here in the
 * browser and nothing ever compares it to the Nest code: rename `email` on the
 * entity and this file still compiles, then breaks at runtime.
 * That contrast is the point of the demo.
 */

const API_URL = 'http://localhost:3000'

// A hand-written guess at the server's response shape -- a duplicate of
// nest-trpc-poc/src/user/user.entity.ts that the compiler cannot keep in sync.
export interface RestUser {
  id: number
  name: string
  email: string
}

async function body(res: Response): Promise<unknown> {
  const parsed: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : `HTTP ${res.status}`
    throw new Error(message)
  }
  return parsed
}

export async function restCreateUser(input: { name: string; email: string }) {
  // Verb, URL, headers and body all assembled by hand.
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  // `as` is an assertion, not a check. Nothing verifies this at runtime.
  return (await body(res)) as RestUser
}

export async function restGetUser(id: number): Promise<RestUser> {
  // The REST API exposes GET /users (all) and POST /users -- there is no
  // GET /users/:id -- so reading one user by id means over-fetching the whole
  // collection and filtering in the browser. Compare with tRPC, where
  // `user.getById` is a first-class procedure.
  const res = await fetch(`${API_URL}/users`)
  const all = (await body(res)) as RestUser[]
  const found = all.find((u) => u.id === id)
  if (!found) throw new Error(`User ${id} not found`)
  return found
}
