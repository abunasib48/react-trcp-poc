import { useState } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@backend/trpc/trpc.router.js'
import { restCreateUser, restGetUser } from './rest'
import { TRPC_URL, trpc } from './trpc'
import './App.css'

// Derived from the router, never hand-written. Compare with the hand-written
// `RestUser` interface in rest.ts -- this one cannot drift from the server.
type User = inferRouterOutputs<AppRouter>['user']['create']

type Transport = 'REST' | 'tRPC'

function App() {
  const [transport, setTransport] = useState<Transport>('REST')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [lookupId, setLookupId] = useState('')

  const [user, setUser] = useState<User | null>(null)
  const [via, setVia] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(label: string, call: () => Promise<User>) {
    setBusy(true)
    setError(null)
    setUser(null)
    setVia(label)
    try {
      setUser(await call())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function create() {
    run(`create over ${transport}`, () =>
      transport === 'REST'
        ? // hand-built request; response shape asserted, not checked
          restCreateUser({ name, email })
        : // procedure call; input and output both come from AppRouter
          trpc.user.create.mutate({ name, email }),
    )
  }

  function fetchById() {
    const id = Number(lookupId)
    run(`getById over ${transport}`, () =>
      transport === 'REST' ? restGetUser(id) : trpc.user.getById.query({ id }),
    )

    // --- The type-safety demo -------------------------------------------
    // Uncomment the next line and `npx tsc --noEmit` fails right here, before
    // the app is ever served, because AppRouter says this input is a number:
    //   error TS2322: Type 'string' is not assignable to type 'number'.
    // trpc.user.getById.query({ id: '1' })
    //
    // The REST equivalent has no such guard: restGetUser(id) with the wrong
    // shape, or a rename of `email` on the Nest entity, compiles happily and
    // only fails once it is running in the browser.
  }

  return (
    <main className="poc">
      <h1>Same UserService, two transports</h1>
      <p className="hint">
        Both paths end at the one <code>UserService</code> &rarr; TypeORM &rarr;
        the single <code>users</code> table in PostgreSQL.
      </p>

      <fieldset>
        <legend>Transport</legend>
        {(['REST', 'tRPC'] as const).map((t) => (
          <label key={t}>
            <input
              type="radio"
              name="transport"
              value={t}
              checked={transport === t}
              onChange={() => setTransport(t)}
            />
            {t}
          </label>
        ))}
        <p className="hint">
          {transport === 'REST'
            ? 'fetch() -> http://localhost:3000/users (no :id route; filters client-side)'
            : `trpc client -> ${TRPC_URL}`}
        </p>
      </fieldset>

      <fieldset>
        <legend>Create user</legend>
        <input
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="button" onClick={create} disabled={busy || !name || !email}>
          Create over {transport}
        </button>
      </fieldset>

      <fieldset>
        <legend>Fetch user by id</legend>
        <input
          placeholder="id"
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
        />
        <button type="button" onClick={fetchById} disabled={busy || !lookupId}>
          Fetch over {transport}
        </button>
      </fieldset>

      <section className="result">
        {busy && <p>Loading...</p>}
        {error && (
          <p className="error">
            Error ({via}): {error}
          </p>
        )}
        {user && (
          <pre>
            {via}
            {'\n'}id:    {user.id}
            {'\n'}name:  {user.name}
            {'\n'}email: {user.email}
          </pre>
        )}
      </section>
    </main>
  )
}

export default App
