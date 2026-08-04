import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import SearchingPairs from './components/SearchingPairs';
import ActiveSignals from './components/ActiveSignals';
import SignalHistory from './components/SignalHistory';
import SignalDetailModal from './components/SignalDetailModal';
import WeeklyPerformance from './components/WeeklyPerformance';
import { playAlertSound, triggerDesktopNotification, requestAlertPermission } from './utils/alertUtils';
import './App.css';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jzjhdjstlokbgklmxlgv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_4neSllJ9YkupZ-VgpC9ZJQ_2OPCE0ha';
const supabase = createClient(supabaseUrl, supabaseKey);

const MONITORED_PAIRS = [
  "frxEURUSD",
  "frxGBPUSD",
  "frxAUDUSD",
  "frxUSDJPY",
  "frxEURJPY",
  "frxGBPJPY"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('searching');
  const [signals, setSignals] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({}); // To check price direction (up/down)
  const [ticker, setTicker] = useState(0); // Forces re-render for countdowns
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return "Notification" in window && Notification.permission === "granted";
  });
  const alertsEnabledRef = useRef(alertsEnabled);
  const wsRef = useRef(null);

  useEffect(() => {
    alertsEnabledRef.current = alertsEnabled;
  }, [alertsEnabled]);

  const handleToggleAlerts = async () => {
    if (alertsEnabled) {
      setAlertsEnabled(false);
    } else {
      const granted = await requestAlertPermission();
      if (granted) {
        setAlertsEnabled(true);
      }
    }
  };

  // 1. Fetch initial signals from database on mount
  useEffect(() => {
    async function fetchSignals() {
      try {
        const { data, error } = await supabase
          .from('signals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) {
          console.error('Error fetching signals:', error.message);
        } else {
          setSignals(data || []);
        }
      } catch (err) {
        console.error('Failed to connect to Supabase:', err);
      }
    }

    fetchSignals();
  }, []);

  // 2. Subscribe to Realtime Supabase changes
  useEffect(() => {
    const channel = supabase
      .channel('live-signals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signals' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            console.log('New signal received:', payload.new);
            setSignals((prev) => [payload.new, ...prev]);
            
            if (alertsEnabledRef.current) {
              playAlertSound();
              triggerDesktopNotification(payload.new);
            }

            // Automatically switch to Active Signals tab when a new signal arrives
            setActiveTab('active');
          } else if (payload.eventType === 'UPDATE') {
            console.log('Signal updated:', payload.new);
            setSignals((prev) =>
              prev.map((sig) => (sig.id === payload.new.id ? payload.new : sig))
            );
          } else if (payload.eventType === 'DELETE') {
            setSignals((prev) => prev.filter((sig) => sig.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Poll Backend API for True Live Prices (Tiingo WebSocket routed via Render)
  useEffect(() => {
    let intervalId;

    const fetchLivePrices = async () => {
      try {
        const url = "https://forex-binary-bot-backend-1.onrender.com/api/prices";
        const response = await fetch(url);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data && Object.keys(data).length > 0) {
          setLivePrices((prev) => {
            const newPrices = { ...prev };
            let hasChanges = false;
            
            Object.keys(data).forEach(symbol => {
              const price = data[symbol];
              if (price && prev[symbol] !== price) {
                setPrevPrices(p => ({ ...p, [symbol]: prev[symbol] || price }));
                newPrices[symbol] = price;
                hasChanges = true;
              }
            });
            
            return hasChanges ? newPrices : prev;
          });
        }
      } catch (err) {
        console.error("Live Price Fetch Error:", err);
      }
    };

    // Fetch immediately on mount
    fetchLivePrices();
    
    // Poll every 1 second for ultra-fast updates
    intervalId = setInterval(fetchLivePrices, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // 4. Ticker to update active countdown timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute number of currently active signals
  const activeCount = signals.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.expiry_time).getTime() > new Date().getTime()
  ).length;

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeSignalsCount={activeCount}
        alertsEnabled={alertsEnabled}
        onToggleAlerts={handleToggleAlerts}
      />

      {/* --- INSTITUTIONAL SESSION-TO-SESSION BANNER --- */}
      {(() => {
        const formatUtcToLocal = (utcHour) => {
          const date = new Date();
          date.setUTCHours(utcHour, 0, 0, 0);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };
        const localStart = formatUtcToLocal(7);
        const localEnd = formatUtcToLocal(16);
        const localLondonNY = formatUtcToLocal(12);
        const localAsian = formatUtcToLocal(22);

        const currentUtcHour = new Date().getUTCHours();
        const isSessionActive = currentUtcHour >= 7 && currentUtcHour < 16;

        let currentSessionName = '';
        let nextSessionInfo = '';
        if (currentUtcHour >= 7 && currentUtcHour < 12) {
          currentSessionName = '🇬🇧 London Open Session (07:00 – 12:00 UTC)';
          nextSessionInfo = `Next Session: 🇬🇧🇺🇸 London & NY Peak Overlap starts at 12:00 UTC (Local: ${localLondonNY})`;
        } else if (currentUtcHour >= 12 && currentUtcHour < 16) {
          currentSessionName = '🇬🇧🇺🇸 London & New York Peak Overlap (12:00 – 16:00 UTC)';
          nextSessionInfo = `Next Session: ⏸️ Asian Dead Zone Sleep starts at 16:00 UTC (Local: ${localEnd})`;
        } else if (currentUtcHour >= 16 && currentUtcHour < 22) {
          currentSessionName = '🇺🇸 Late New York Session (16:00 – 22:00 UTC)';
          nextSessionInfo = `Next Session: 🌏 Asian/Sydney Session at 22:00 UTC | 🟢 London Open at 07:00 UTC (Local: ${localStart})`;
        } else {
          currentSessionName = '🌏 Asian / Tokyo Session (22:00 – 07:00 UTC)';
          nextSessionInfo = `Next Session: 🟢 London Institutional Open starts at 07:00 UTC (Local: ${localStart})`;
        }

        return (
          <div style={{
            background: isSessionActive ? 'linear-gradient(90deg, rgba(0, 230, 118, 0.14) 0%, rgba(0, 230, 118, 0.04) 100%)' : 'linear-gradient(90deg, rgba(255, 171, 0, 0.14) 0%, rgba(255, 171, 0, 0.04) 100%)',
            borderLeft: `4px solid ${isSessionActive ? '#00e676' : '#ffab00'}`,
            padding: '0.9rem 1.2rem',
            margin: '1rem 0 0 0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.8rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isSessionActive ? '#00e676' : '#ffab00',
                display: 'inline-block',
                boxShadow: isSessionActive ? '0 0 10px #00e676' : '0 0 10px #ffab00'
              }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  {isSessionActive ? `🟢 ACTIVE SESSION: ${currentSessionName}` : `⏸️ SESSION SLEEP: ${currentSessionName}`}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', marginTop: '3px' }}>
                  ⚡ Bot Signals Window: <strong style={{ color: '#fff' }}>07:00 UTC – 16:00 UTC</strong> &nbsp;|&nbsp; Your Local Country Time: <strong style={{ color: '#00e676' }}>{localStart} – {localEnd}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#80d8ff', marginTop: '3px', fontWeight: 500 }}>
                  📅 {nextSessionInfo}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', padding: '0.45rem 0.8rem', borderRadius: '6px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
              {isSessionActive ? '⚡ 5m SMC Sniper Signals LIVE' : '🛡️ Bot Paused — Low Liquidity Noise Filter'}
            </div>
          </div>
        );
      })()}

      <main style={{ marginTop: '1rem' }}>
        {activeTab === 'searching' && (
          <SearchingPairs livePrices={livePrices} prevPrices={prevPrices} />
        )}
        
        {activeTab === 'active' && (
          <ActiveSignals signals={signals} livePrices={livePrices} />
        )}
        
        {activeTab === 'history' && (
          <SignalHistory 
            signals={signals} 
            onSelectSignal={(sig) => setSelectedSignal(sig)} 
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyPerformance signals={signals} />
        )}
      </main>

      {/* Signal Details Modal */}
      {selectedSignal && (
        <SignalDetailModal 
          signal={selectedSignal} 
          onClose={() => setSelectedSignal(null)} 
        />
      )}
    </div>
  );
}
