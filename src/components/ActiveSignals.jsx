import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';

function ActiveSignalCard({ signal, livePrice }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiry = new Date(signal.expiry_time).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [signal.expiry_time]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatPairName = (pair) => {
    if (pair.startsWith('frx') && pair.length === 9) {
      return `${pair.substring(3, 6)}/${pair.substring(6)}`;
    }
    return pair;
  };

  const isCall = signal.type === 'CALL';
  
  // Real-time outcome status evaluation
  let outcomeText = "WAITING FOR FEED...";
  let outcomeColor = "var(--text-muted)";
  let isWinning = false;
  let isLosing = false;

  if (livePrice) {
    const entry = Number(signal.entry_price);
    const live = Number(livePrice);
    
    if (isCall) {
      if (live > entry) {
        outcomeText = "ITM - WINNING";
        outcomeColor = "#00e676";
        isWinning = true;
      } else if (live < entry) {
        outcomeText = "OTM - LOSING";
        outcomeColor = "#ff1744";
        isLosing = true;
      } else {
        outcomeText = "ATM - TIE";
        outcomeColor = "var(--text-secondary)";
      }
    } else { // PUT
      if (live < entry) {
        outcomeText = "ITM - WINNING";
        outcomeColor = "#00e676";
        isWinning = true;
      } else if (live > entry) {
        outcomeText = "OTM - LOSING";
        outcomeColor = "#ff1744";
        isLosing = true;
      } else {
        outcomeText = "ATM - TIE";
        outcomeColor = "var(--text-secondary)";
      }
    }
  }

  return (
    <div className={`signal-card ${isCall ? 'call' : 'put'}`} style={{
      boxShadow: isWinning 
        ? '0 8px 32px 0 rgba(0, 230, 118, 0.15)' 
        : isLosing 
          ? '0 8px 32px 0 rgba(255, 23, 68, 0.15)' 
          : ''
    }}>
      <div className="signal-glow-bg"></div>
      <div className="signal-header">
        <span className="signal-badge">
          {isCall ? (
            <>
              <TrendingUp size={16} /> CALL
            </>
          ) : (
            <>
              <TrendingDown size={16} /> PUT
            </>
          )}
        </span>
        <div className="countdown-timer">
          <Clock size={14} className="timer-icon" />
          <span>{timeLeft > 0 ? formatTime(timeLeft) : 'EXPIRING...'}</span>
        </div>
      </div>

      <div className="signal-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatPairName(signal.pair)}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>5 Min Expiry</span>
        </div>

        {/* Live Status Banner */}
        <div style={{
          textAlign: 'center',
          padding: '0.4rem',
          borderRadius: '8px',
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${outcomeColor}`,
          color: outcomeColor,
          fontWeight: 'bold',
          fontSize: '0.85rem',
          marginBottom: '1rem',
          letterSpacing: '0.5px'
        }}>
          {outcomeText}
        </div>

        {/* Pricing Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="price-box" style={{ marginBottom: 0 }}>
            <div className="price-label">Entry Price</div>
            <div className="price-value" style={{ fontSize: '1.2rem' }}>{Number(signal.entry_price).toFixed(5)}</div>
          </div>
          <div className="price-box" style={{ 
            marginBottom: 0, 
            borderColor: outcomeColor, 
            boxShadow: livePrice ? `0 0 10px ${outcomeColor}22` : 'none'
          }}>
            <div className="price-label" style={{ color: outcomeColor }}>Live Price</div>
            <div className="price-value" style={{ 
              fontSize: '1.2rem', 
              color: livePrice ? outcomeColor : 'var(--text-primary)',
              fontFamily: 'monospace'
            }}>
              {livePrice ? Number(livePrice).toFixed(5) : 'Streaming...'}
            </div>
          </div>
        </div>

        <div className="signal-metrics">
          <div className="metric-box">
            <div className="label">RSI (14)</div>
            <div className="val" style={{ color: isCall ? '#00e676' : '#ff1744' }}>
              {Number(signal.rsi_value).toFixed(1)}
            </div>
          </div>
          <div className="metric-box">
            <div className="label">Stoch %K</div>
            <div className="val" style={{ color: isCall ? '#00e676' : '#ff1744' }}>
              {Number(signal.stochastic_k).toFixed(1)}
            </div>
          </div>
          <div className="metric-box">
            <div className="label">Volume</div>
            <div className="val" style={{ color: '#00e5ff' }}>
              {Number(signal.volume_value).toFixed(1)}x
            </div>
          </div>
        </div>
      </div>

      <div className="signal-footer">
        Generated at {new Date(signal.created_at).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default function ActiveSignals({ signals, livePrices = {} }) {
  const activeSignals = signals.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.expiry_time).getTime() > new Date().getTime()
  );

  if (activeSignals.length === 0) {
    return (
      <div className="empty-state" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-glass)', borderRadius: '20px' }}>
        <AlertCircle size={48} className="empty-icon" style={{ color: 'var(--text-secondary)' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>No Active Signals</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Searching markets for high-probability setups...
        </p>
      </div>
    );
  }

  return (
    <div className="active-container">
      {activeSignals.map((signal) => (
        <ActiveSignalCard 
          key={signal.id} 
          signal={signal} 
          livePrice={livePrices[signal.pair]} 
        />
      ))}
    </div>
  );
}
