import React, { useRef, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function UploadSection({ onDataReady }) {
  const fileInputRef = useRef(null)
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState(null)

  useEffect(() => {
    let interval;
    if (jobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/jobs/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.status === 401) throw new Error("Session expired");
          const data = await res.json();
          
          if (data.status === 'COMPLETED') {
            clearInterval(interval);
            setLoading(false);
            setJobId(null);
            onDataReady({ summary: data.summary, anomalies: data.anomalies });
          } else if (data.status === 'FAILED') {
            clearInterval(interval);
            setLoading(false);
            setJobId(null);
            setError(data.error || 'Server error occurred during processing');
          }
        } catch (err) {
          clearInterval(interval);
          setLoading(false);
          setJobId(null);
          setError(err.message);
        }
      }, 2000); // poll every 2 seconds
    }
    return () => clearInterval(interval);
  }, [jobId, token, onDataReady]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return;

    setLoading(true);
    setError(null);
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload-invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to enqueue job');
      }
      
      const result = await response.json()
      setJobId(result.job_id); // Start polling
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDivClick = () => {
    if (!loading) fileInputRef.current.click()
  }

  return (
    <div>
      {error && (
        <div className="glass" style={{ padding: '1rem', color: '#fca5a5', marginBottom: '2rem', border: '1px solid #ef4444' }}>
          ⚠ Error: {error}
        </div>
      )}
      <div className="glass upload-section" onClick={handleDivClick} style={{ cursor: loading ? 'wait' : 'pointer' }}>
        <div className="upload-icon">{loading ? '⏳' : '📁'}</div>
        <h2>{loading ? 'Running ML Isolation Forest...' : 'Upload GST Invoices'}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          {loading ? 'Auditing batches in background...' : 'Format: CSV (Invoice_ID, GSTIN_Supplier, Total_Amount, CGST, SGST, IGST)'}
        </p>
        <input 
          type="file" 
          accept=".csv" 
          className="file-input" 
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>
    </div>
  )
}
