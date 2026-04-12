import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './AdminPage'
import AdminGate from './AdminGate'
import ViewerPage from './ViewerPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminGate><AdminPage /></AdminGate>} />
        <Route path="/" element={<ViewerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
