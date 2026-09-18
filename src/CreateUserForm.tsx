import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { inferRouterInputs } from '@trpc/server'
import type { AppRouter } from '@backend/trpc/trpc.router.js'
import { restCreateUser, type RestUser } from './rest'
import { trpc } from './trpc'

// Inferred from the router's zod schema -- the form state itself is typed by
// the server contract. Drop a field on the backend and this form stops
// compiling. Contrast with `RestCreateUserInput` in rest.ts, hand-written.
type CreateInput = inferRouterInputs<AppRouter>['user']['create']

// Typed from the contract too, so removing a gender on the server is a
// compile error here rather than a broken dropdown.
const GENDERS: CreateInput['gender'][] = ['male', 'female', 'other']

const EMPTY: CreateInput = {
  name: '',
  email: '',
  gender: 'female',
  profession: '',
  address: '',
}

type Transport = 'REST' | 'tRPC'

export function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [transport, setTransport] = useState<Transport>('REST')
  const [form, setForm] = useState<CreateInput>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ user: RestUser; via: Transport } | null>(
    null,
  )

  function set<K extends keyof CreateInput>(key: K, value: CreateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setCreated(null)
    try {
      const user =
        transport === 'REST'
          ? // hand-built POST; the response shape is asserted, not checked,
            // and the controller validates nothing
            await restCreateUser(form)
          : // procedure call; input is checked against the server's zod schema
            // at compile time here and again at runtime on the server
            await trpc.user.create.mutate(form)

      setCreated({ user, via: transport })
      setForm(EMPTY)
      onCreated() // refresh the REST-loaded table below
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card create" onSubmit={submit}>
      <div className="create-head">
        <h2>Create a user</h2>
        <span className="transport">
          {transport === 'REST'
            ? 'Creates via REST POST /users'
            : 'Creates via tRPC user.create'}
        </span>
      </div>

      <div className="radio-row">
        {(['REST', 'tRPC'] as const).map((t) => (
          <label key={t} className="radio">
            <input
              type="radio"
              name="create-transport"
              value={t}
              checked={transport === t}
              onChange={() => setTransport(t)}
            />
            {t}
          </label>
        ))}
      </div>

      <div className="create-grid">
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Grace Hopper"
            required
          />
        </label>
        <label>
          Email
          <input
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="grace@example.com"
            required
          />
        </label>
        <label>
          Gender
          <select
            value={form.gender}
            onChange={(e) => set('gender', e.target.value as CreateInput['gender'])}
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          Profession
          <input
            value={form.profession}
            onChange={(e) => set('profession', e.target.value)}
            placeholder="Rear Admiral"
            required
          />
        </label>
        <label className="full">
          Address
          <input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Arlington, Virginia, USA"
            required
          />
        </label>
      </div>

      <div className="create-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : `Create over ${transport}`}
        </button>
        {created && (
          <span className="ok">
            Created{' '}
            <Link to={`/users/${created.user.id}`}>
              #{created.user.id} {created.user.name}
            </Link>{' '}
            over {created.via}
          </span>
        )}
      </div>

      {error && (
        <p className="create-error">
          <strong>{transport} create failed.</strong> {error}
        </p>
      )}
    </form>
  )
}
