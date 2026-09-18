import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { UserDetail } from './routes/UserDetail'
import { UserTable } from './routes/UserTable'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Table page: REST only */}
        <Route path="/" element={<UserTable />} />
        {/* Detail page: tRPC only */}
        <Route path="/users/:id" element={<UserDetail />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
