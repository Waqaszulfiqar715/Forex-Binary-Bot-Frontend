import React from 'react';
import { History, CheckCircle, XCircle, MinusCircle, ShieldCheck, Award } from 'lucide-react';
import { isCurrentTradingWeek } from '../utils/dateUtils';

export default function SignalHistory({ signals, onSelectSignal }) {
  // Filter for completed/expired signals (WON, LOST, TIE, or expired ACTIVE signals)
  // AND they must belong to the current active trading week (Mon-Fri)
  const historySignals = signals.filter(
    (s) => (s.status !== 'ACTIVE' || new Date(s.expiry_time).getTime() <= new Date().getTime()) 
           && isCurrentTradingWeek(s.created_at)
  );

  // Stats calculation
  const total = historySignals.length;
  const won = historySignals.filter((s) => s.status === 'WON').length;
  const lost = historySignals.filter((s) => s.status === 'LOST').length;
  const tie = historySignals.filter((s) => s.status === 'TIE').length;
  
  // Win rate based on decided outcomes (excluding ties)
  const decided = won + lost;
  const winRate = decided > 0 ? ((won / decided) * 100).toFixed(1) : '0.0';

  const formatPairName = (pair) => {
    if (pair.startsWith('frx') && pair.length === 9) {
      return `${pair.substring(3, 6)}/${pair.substring(6)}`;
    }
    return pair;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WON':
        return <span className="badge-status won"><CheckCircle size={12} /> WON</span>;
      case 'LOST':
        return <span className="badge-status lost"><XCircle size={12} /> LOST</span>;
      case 'TIE':
        return <span className="badge-status tie"><MinusCircle size={12} /> TIE</span>;
      default:
        return <span className="badge-status active">EXPIRED</span>;
    }
  };

  return (
    <div className="history-wrapper">
      <div className="history-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} style={{ color: 'var(--accent-blue)' }} /> Signal History
        </h2>
        <div className="history-stats">
          <div className="stat-item">
            <span className="stat-label">Total Signals:</span>
            <span className="stat-value" style={{ color: '#fff' }}>{total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Won:</span>
            <span className="stat-value won">{won}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Lost:</span>
            <span className="stat-value lost">{lost}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Win Rate:</span>
            <span className="stat-value" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={16} /> {winRate}%
            </span>
          </div>
        </div>
      </div>

      {historySignals.length === 0 ? (
        <div className="empty-state">
          <Award size={48} className="empty-icon" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>No History Records</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Signals will appear here once they expire and outcomes are verified.
          </p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Pair</th>
                <th>Type</th>
                <th>Entry Price</th>
                <th>Expiry Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historySignals.map((signal) => (
                <tr key={signal.id} className="history-row" onClick={() => onSelectSignal(signal)}>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(signal.created_at).toLocaleDateString()} {new Date(signal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatPairName(signal.pair)}</td>
                  <td>
                    <span className={`badge-type ${signal.type === 'CALL' ? 'call' : 'put'}`}>
                      {signal.type}
                    </span>
                  </td>
                  <td>{Number(signal.entry_price).toFixed(5)}</td>
                  <td>{signal.expiry_price ? Number(signal.expiry_price).toFixed(5) : '-'}</td>
                  <td>{getStatusBadge(signal.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
