/**
 * TRANSPORT A - REST, over plain `fetch`.
 * Used by the table page (read) and by the create form when REST is selected.
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

/**
 * Hand-written request type, same problem as `RestUser` above: nothing checks
 * it against UserController.create's signature. Send `proffesion` by mistake
 * and REST happily stores a user with a null profession.
 *
 * Note also that the REST controller does NO validation -- the tRPC procedure
 * runs a zod schema on the exact same fields. Create a user with the email
 * "not-an-email" over each transport and watch only one of them refuse.
 */
export interface RestCreateUserInput {
  name: string
  email: string
  gender: 'male' | 'female' | 'other'
  profession: string
  address: string
}

export async function restCreateUser(
  input: RestCreateUserInput,
): Promise<RestUser> {
  // Verb, URL, headers and body all assembled by hand.
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const parsed: unknown = await res.json().catch(() => null)
    const message =
      parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : `POST /users failed with HTTP ${res.status}`
    throw new Error(message)
  }
  // `as` is an assertion, not a check.
  return (await res.json()) as RestUser
}
