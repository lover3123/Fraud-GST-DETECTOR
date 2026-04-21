import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import UploadSection from './components/UploadSection'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function MainApp() {
  const { token, logout, user } = useAuth()
  const [data, setData] = useState(null)
  
  const handleReset = () => {
    setData(null)
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', textAlign: 'left' }}>GST Fraud Intelligence</h1>
          <p className="subtitle">Enterprise Anomaly Detection</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
          <button onClick={logout} className="btn" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)' }}>Logout</button>
        </div>
      </header>

      <main>
        {!data ? (
          <UploadSection onDataReady={setData} />
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
               <button className="btn" onClick={handleReset}>New Audit</button>
            </div>
            <Dashboard data={data} />
          </div>
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App

