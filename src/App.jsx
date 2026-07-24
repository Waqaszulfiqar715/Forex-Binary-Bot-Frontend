import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import SearchingPairs from './components/SearchingPairs';
import ActiveSignals from './components/ActiveSignals';
import SignalHistory from './components/SignalHistory';
import SignalDetailModal from './components/SignalDetailModal';
import WeeklyPerformance from './components/WeeklyPerformance';
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
  const wsRef = useRef(null);

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

  // 3. Connect to Deriv WebSocket for real-time live prices
  useEffect(() => {
    const connectWS = () => {
      const wsUrl = "wss://api.tiingo.com/fx";
      console.log("Connecting frontend to Tiingo WS for live prices...");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Frontend WS Connected to Tiingo. Subscribing to ticks...");
        const tiingoPairs = MONITORED_PAIRS.map(p => p.replace("frx", "").toLowerCase());
        
        ws.send(JSON.stringify({
          eventName: "subscribe",
          authorization: "6d5442a6595792eed12d7371665df2190ade68fe",
          eventData: {
            thresholdLevel: 5,
            tickers: tiingoPairs
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.messageType === "A" && data.data && data.data.length > 2) {
            const ticker = String(data.data[1]).toUpperCase();
            const symbol = "frx" + ticker;
            
            // Find the last number in the array which is usually the mid/bid price
            const price = [...data.data].reverse().find(v => typeof v === 'number');

            if (symbol && price) {
              setLivePrices((prev) => {
                setPrevPrices((prevDir) => ({
                  ...prevDir,
                  [symbol]: prev[symbol] || price
                }));
                return {
                  ...prev,
                  [symbol]: price
                };
              });
            }
          }
        } catch(e) {}
      };

      ws.onclose = () => {
        console.log("Frontend WS disconnected. Reconnecting in 5 seconds...");
        setTimeout(connectWS, 5000);
      };

      ws.onerror = (err) => {
        console.error("Frontend WS Error:", err);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
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
      />

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
