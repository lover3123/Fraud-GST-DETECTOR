import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function Dashboard({ data }) {
  const { summary, anomalies } = data

  const getRiskBadge = (score) => {
    if (score >= 50) return <span className="badge badge-danger">{score}/100 High Risk</span>
    if (score > 0) return <span className="badge badge-warning">{score}/100 Warning</span>
    return <span>Clear</span>
  }

  // Chart data
  const chartData = {
    labels: ['Safe Invoices', 'High Risk (Fraud Flagged)'],
    datasets: [
      {
        label: 'Number of Invoices',
        data: [summary.total_invoices - summary.high_risk_count, summary.high_risk_count],
        backgroundColor: [
          'rgba(16, 185, 129, 0.5)',
          'rgba(239, 68, 68, 0.5)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Invoice Risk Distribution' },
    },
    scales: {
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false }
      }
    }
  }

  return (
    <div className="dashboard">
      <div className="metrics-grid">
        <div className="glass metric-card">
          <div className="metric-title">Total Invoices Evaluated</div>
          <div className="metric-value">{summary.total_invoices}</div>
        </div>
        <div className="glass metric-card">
          <div className="metric-title">Total GST Amount</div>
          <div className="metric-value">₹{summary.total_gst_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass metric-card">
          <div className="metric-title">High Risk Flags</div>
          <div className={`metric-value ${summary.high_risk_count > 0 ? 'value-danger' : 'value-success'}`}>
            {summary.high_risk_count}
          </div>
        </div>
      </div>

      <div className="glass chart-container" style={{background: 'var(--bg-color)'}}>
         <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="glass table-wrapper">
        <h3 style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>Intelligence Audit Report</h3>
        {anomalies.length === 0 ? (
          <p style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>No anomalies detected. All invoices passed standard checks.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Supplier GSTIN</th>
                <th>Amount (₹)</th>
                <th>Risk Score</th>
                <th>Detected Flags (Reasons)</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.Invoice_ID}</td>
                  <td>{item.GSTIN_Supplier || 'N/A'}</td>
                  <td>₹{parseFloat(item.Total_Amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td>{getRiskBadge(item.Risk_Score)}</td>
                  <td>
                    <ul style={{ listStylePosition: 'inside', padding: 0 }}>
                      {item.Flags.map((flag, i) => (
                        <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{flag}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
