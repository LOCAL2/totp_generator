import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './AdminPage'
import ViewerPage from './ViewerPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<ViewerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
