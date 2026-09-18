import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { restGetUsers, type RestUser } from '../rest'

/** Older rows predate the gender/profession/address columns, so they are null. */
function Blank() {
  return <span className="blank">&mdash;</span>
}

function Gender({ value }: { value: RestUser['gender'] }) {
  if (!value) return <Blank />
  return <span className={`pill pill-${value}`}>{value}</span>
}

export function UserTable() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<RestUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    restGetUsers()
      .then(setUsers)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      )
  }, [])

  return (
    <main className="page">
      <header className="page-head">
        <h1>Users</h1>
        <span className="transport">Loaded via REST GET /users</span>
      </header>

      {error && (
        <div className="notice notice-error">
          <strong>Could not load users.</strong>
          <p>{error}</p>
          <p className="muted">Is the Nest server running on port 3000?</p>
        </div>
      )}

      {!error && users === null && <div className="notice">Loading users…</div>}

      {!error && users?.length === 0 && (
        <div className="notice">
          <strong>No users yet.</strong>
          <p className="muted">Create one and it will show up here.</p>
        </div>
      )}

      {!error && users && users.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Profession</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} onClick={() => navigate(`/users/${u.id}`)}>
                  <td className="col-id">{u.id}</td>
                  <td>
                    {/* A real href, so the row is middle-clickable and crawlable. */}
                    <Link to={`/users/${u.id}`}>{u.name}</Link>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td>
                    <Gender value={u.gender} />
                  </td>
                  <td>{u.profession ?? <Blank />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {users && users.length > 0 && (
        <p className="muted count">
          {users.length} user{users.length === 1 ? '' : 's'} · click a row for
          the tRPC detail view
        </p>
      )}
    </main>
  )
}
