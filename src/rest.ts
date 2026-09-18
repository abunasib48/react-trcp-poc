/**
 * TRANSPORT A - REST, over plain `fetch`. Used by the table page only.
 */

const API_URL = 'http://localhost:3000'

/**
 * Hand-written ON PURPOSE.
 *
 * REST ships no types, so this interface is a guess that has to be kept in
 * sync with nest-trpc-poc/src/user/user.entity.ts by hand. Rename `profession`
 * on the server and this file still compiles -- the column just silently
 * renders as "—" forever, and nothing tells you until someone notices.
 *
 * The tRPC side cannot drift like this: see trpc.ts, where the types come from
 * the server's own AppRouter and a mismatch is a compile error.
 */
export interface RestUser {
  id: number
  name: string
  email: string
  gender: 'male' | 'female' | 'other' | null
  profession: string | null
  address: string | null
}

export async function restGetUsers(): Promise<RestUser[]> {
  // Verb, URL and response shape are all decided here in the browser.
  const res = await fetch(`${API_URL}/users`)
  if (!res.ok) throw new Error(`GET /users failed with HTTP ${res.status}`)
  // `as` is an assertion, not a check. Nothing validates this at runtime.
  return (await res.json()) as RestUser[]
}
