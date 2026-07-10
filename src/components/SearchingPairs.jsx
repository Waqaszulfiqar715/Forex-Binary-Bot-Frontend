import React from 'react';
import { Cpu, Activity } from 'lucide-react';

const PAIRS = [
  { id: 'frxEURUSD', name: 'EUR/USD', desc: 'Euro / US Dollar' },
  { id: 'frxGBPUSD', name: 'GBP/USD', desc: 'British Pound / US Dollar' },
  { id: 'frxAUDUSD', name: 'AUD/USD', desc: 'Australian Dollar / US Dollar' },
  { id: 'frxUSDJPY', name: 'USD/JPY', desc: 'US Dollar / Japanese Yen' },
  { id: 'frxEURJPY', name: 'EUR/JPY', desc: 'Euro / Japanese Yen' },
  { id: 'frxGBPJPY', name: 'GBP/JPY', desc: 'British Pound / Japanese Yen' }
];

export default function SearchingPairs({ livePrices = {}, prevPrices = {} }) {
  return (
    <div className="search-container">
      {PAIRS.map((pair) => {
        const price = livePrices[pair.id];
        const prevPrice = prevPrices[pair.id];
        const isUp = price && prevPrice && price > prevPrice;
        const isDown = price && prevPrice && price < prevPrice;

        return (
          <div key={pair.id} className="pair-card">
            <div className="radar-line"></div>
            <div className="pair-header">
              <span className="pair-title">{pair.name}</span>
              <div className="pair-status">
                <span className="scanning-pulse"></span>
                Searching
              </div>
            </div>
            <div className="pair-body">
              <div className="metric-row" style={{ background: 'rgba(0,0,0,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.02)' }}>
                <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Activity size={14} style={{ color: 'var(--accent-blue)' }} /> Live Price
                </span>
                <span 
                  className="metric-value" 
                  style={{ 
                    color: isUp ? '#00e676' : isDown ? '#ff1744' : 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    transition: 'color 0.15s ease'
                  }}
                >
                  {price ? price.toFixed(5) : 'Streaming...'}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Asset Class</span>
                <span className="metric-value">Forex Pair</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Timeframe</span>
                <span className="metric-value">5 Minutes</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Strategy</span>
                <span className="metric-value">BB + RSI + Stoch</span>
              </div>
              <div className="metric-row" style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Cpu size={14} style={{ color: '#00e5ff' }} /> Engine
                </span>
                <span className="metric-value" style={{ color: '#00e5ff' }}>Active</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
