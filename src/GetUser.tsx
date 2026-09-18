import { useState } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@backend/trpc/trpc.router.js'
import { TRPC_URL, trpc } from './trpc'

// The return type of user.getById, derived from the backend router.
// Nothing about User is written down here -- change the entity on the
// NestJS side and this type changes with it.
type User = inferRouterOutputs<AppRouter>['user']['getById']

export function GetUser() {
  const [id, setId] = useState(2)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGetUser() {
    setLoading(true)
    setError(null)
    setUser(null)
    try {
      // >>> THE POINT OF THE POC <<<
      // `user.getById` is the path through the backend's appRouter.
      // `.query` because the procedure is a .query() (a .mutation() would use .mutate).
      // `{ id }` is checked against the backend's zod input schema, at compile time here
      // and again at runtime on the server.
      const result = await trpc.user.getById.query({ id })
      setUser(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, lineHeight: 1.6 }}>
      <h1>tRPC POC</h1>
      <p style={{ color: '#888' }}>
        <code>{TRPC_URL}</code>
      </p>

      <label>
        User ID:{' '}
        <input
          type="number"
          value={id}
          onChange={(e) => setId(Number(e.target.value))}
        />
      </label>{' '}
      <button type="button" onClick={handleGetUser} disabled={loading}>
        Get User
      </button>

      <div style={{ marginTop: 24 }}>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
        {user && (
          <pre>
            ID: {user.id}
            {'\n'}Name: {user.name}
            {'\n'}Email: {user.email}
          </pre>
        )}
      </div>
    </div>
  )
}
