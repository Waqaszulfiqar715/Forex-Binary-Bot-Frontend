import React from 'react';
import { Shield, Radio, Activity, History, Search, BarChart2, Bell, BellRing } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeSignalsCount, alertsEnabled, onToggleAlerts }) {
  return (
    <header className="navbar">
      <div className="logo-section">
        <Shield className="logo-icon" size={28} />
        <span className="logo-text">QUANTUM BOT</span>
      </div>

      <nav className="nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'searching' ? 'active' : ''}`}
          onClick={() => setActiveTab('searching')}
        >
          <Search size={16} />
          Searching Pairs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Activity size={16} />
          Active Signals
          {activeSignalsCount > 0 && (
            <span 
              style={{
                background: '#ff1744',
                color: '#fff',
                borderRadius: '50%',
                padding: '0.1rem 0.4rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginLeft: '0.2rem',
                display: 'inline-block',
                minWidth: '18px',
                textAlign: 'center'
              }}
            >
              {activeSignalsCount}
            </span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          Signal History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          <BarChart2 size={16} />
          Weekly Performance
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={onToggleAlerts}
          title={alertsEnabled ? "Desktop popup & sound alerts are active" : "Click to enable sound and desktop popup alerts"}
          style={{
            background: alertsEnabled ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${alertsEnabled ? '#00e676' : 'rgba(255, 255, 255, 0.2)'}`,
            color: alertsEnabled ? '#00e676' : '#fff',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginRight: '0.8rem',
            transition: 'all 0.2s'
          }}
        >
          {alertsEnabled ? <BellRing size={15} /> : <Bell size={15} />}
          {alertsEnabled ? 'Alerts ON' : 'Enable Alerts'}
        </button>

        <div className="connection-badge">
          <span className="connection-dot"></span>
          <Radio size={14} style={{ marginRight: '0.25rem' }} />
          Live Feed
        </div>
      </div>
    </header>
  );
}

