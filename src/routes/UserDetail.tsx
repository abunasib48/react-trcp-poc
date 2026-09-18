import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TRPCClientError } from '@trpc/client'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@backend/trpc/trpc.router.js'
import { trpc } from '../trpc'

// Inferred from the router, never hand-written -- contrast with `RestUser` in
// rest.ts. If the entity gains or loses a field, this type follows on the next
// compile and any stale usage below becomes a type error.
type User = inferRouterOutputs<AppRouter>['user']['getById']

type State =
  | { status: 'loading' }
  | { status: 'ok'; user: User }
  | { status: 'notFound' }
  | { status: 'error'; message: string }

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{value ?? <span className="blank">&mdash;</span>}</dd>
    </div>
  )
}

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  // Tagged with the id it belongs to, so a result left over from the previous
  // route reads as "still loading" rather than showing the wrong user.
  const [result, setResult] = useState<{ id: string; state: State } | null>(null)
  const requestedId = useRef<string | null>(null)

  const numericId = Number(id)
  const idIsValid = Number.isInteger(numericId) && numericId > 0

  const state: State = !idIsValid
    ? { status: 'notFound' }
    : result && result.id === id
      ? result.state
      : { status: 'loading' }

  useEffect(() => {
    if (!idIsValid || id === undefined) return

    // React StrictMode runs effects twice in dev. Without this guard the same
    // query fires twice and httpBatchLink merges the pair into a single HTTP
    // request that repeats the id: input={"0":{"id":1},"1":{"id":1}}.
    // Production builds do not double-invoke, so this only affects dev noise.
    if (requestedId.current === id) return
    requestedId.current = id

    const settle = (s: State) => setResult({ id, state: s })

    // The tRPC call. `numericId` must be a number and `user` comes back fully
    // typed -- both facts come from AppRouter, not from anything written here.
    trpc.user.getById
      .query({ id: numericId })
      .then((user) => settle({ status: 'ok', user }))
      .catch((e: unknown) => {
        if (e instanceof TRPCClientError && e.data?.code === 'NOT_FOUND') {
          settle({ status: 'notFound' })
        } else {
          settle({
            status: 'error',
            message: e instanceof Error ? e.message : String(e),
          })
        }
      })

    // --- The type-safety demo -------------------------------------------
    // Uncomment the next line and `npx tsc --noEmit` fails right here, before
    // the app is ever served, because AppRouter says this input is a number:
    //   error TS2322: Type 'string' is not assignable to type 'number'.
    // trpc.user.getById.query({ id: '1' })
    //
    // The REST table has no such guard: RestUser in rest.ts is hand-written,
    // so it can drift from the entity and only fail once it is in the browser.
  }, [id, numericId, idIsValid])

  return (
    <main className="page page-narrow">
      <Link to="/" className="back">
        &larr; Back to all users
      </Link>

      <header className="page-head">
        <h1>
          {state.status === 'ok' ? state.user.name : `User ${id ?? ''}`}
        </h1>
        <span className="transport">Loaded via tRPC user.getById</span>
      </header>

      {state.status === 'loading' && <div className="notice">Loading user…</div>}

      {state.status === 'notFound' && (
        <div className="notice">
          <strong>User not found.</strong>
          <p className="muted">
            No user with id {id} exists. It may have been deleted, or the id in
            the URL is wrong.
          </p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="notice notice-error">
          <strong>Could not load this user.</strong>
          <p>{state.message}</p>
          <p className="muted">Is the Nest server running on port 3000?</p>
        </div>
      )}

      {state.status === 'ok' && (
        <dl className="card">
          <Field label="ID" value={String(state.user.id)} />
          <Field label="Name" value={state.user.name} />
          <Field label="Email" value={state.user.email} />
          <div className="field">
            <dt>Gender</dt>
            <dd>
              {state.user.gender ? (
                <span className={`pill pill-${state.user.gender}`}>
                  {state.user.gender}
                </span>
              ) : (
                <span className="blank">&mdash;</span>
              )}
            </dd>
          </div>
          <Field label="Profession" value={state.user.profession} />
          <Field label="Address" value={state.user.address} />
        </dl>
      )}
    </main>
  )
}
