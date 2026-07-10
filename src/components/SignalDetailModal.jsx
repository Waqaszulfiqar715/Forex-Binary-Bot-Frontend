import React from 'react';
import { X, TrendingUp, TrendingDown, Clock, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export default function SignalDetailModal({ signal, onClose }) {
  if (!signal) return null;

  const formatPairName = (pair) => {
    if (pair.startsWith('frx') && pair.length === 9) {
      return `${pair.substring(3, 6)}/${pair.substring(6)}`;
    }
    return pair;
  };

  const isCall = signal.type === 'CALL';

  const getStatusText = (status) => {
    switch (status) {
      case 'WON':
        return <span style={{ color: 'var(--accent-call)', fontWeight: 800 }}>🏆 WON (PROFIT)</span>;
      case 'LOST':
        return <span style={{ color: 'var(--accent-put)', fontWeight: 800 }}>📉 LOST (LOSS)</span>;
      case 'TIE':
        return <span style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>⚪ TIE (REFUND)</span>;
      default:
        return <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>ACTIVE</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h3 className="modal-title">{formatPairName(signal.pair)} Details</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            ID: {signal.id.substring(0, 8)}...
          </p>
        </div>

        <div className="modal-body">
          {/* Signal summary banner */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '12px',
              background: isCall ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 23, 68, 0.08)',
              border: isCall ? '1px solid rgba(0, 230, 118, 0.15)' : '1px solid rgba(255, 23, 68, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isCall ? (
                <TrendingUp size={20} style={{ color: 'var(--accent-call)' }} />
              ) : (
                <TrendingDown size={20} style={{ color: 'var(--accent-put)' }} />
              )}
              <span style={{ fontWeight: 800, color: isCall ? 'var(--accent-call)' : 'var(--accent-put)' }}>
                {signal.type}
              </span>
            </div>
            <div>
              {getStatusText(signal.status)}
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-row">
              <span className="label">Entry Price</span>
              <span className="value" style={{ color: '#fff' }}>{Number(signal.entry_price).toFixed(5)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Expiry Price</span>
              <span className="value" style={{ color: '#fff' }}>
                {signal.expiry_price ? Number(signal.expiry_price).toFixed(5) : 'Calculating...'}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Entry Time</span>
              <span className="value">
                {new Date(signal.created_at).toLocaleDateString()} {new Date(signal.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Expiry Time</span>
              <span className="value">
                {new Date(signal.expiry_time).toLocaleDateString()} {new Date(signal.expiry_time).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="detail-section" style={{ background: 'rgba(0, 229, 255, 0.03)', borderColor: 'rgba(0, 229, 255, 0.1)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Technical Indicators at Entry
            </h4>
            <div className="detail-row">
              <span className="label">Relative Strength Index (RSI)</span>
              <span className="value">{Number(signal.rsi_value).toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Stochastic Oscillator (%K)</span>
              <span className="value">{Number(signal.stochastic_k).toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Volume Ratio (MA)</span>
              <span className="value">{Number(signal.volume_value).toFixed(2)}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
