import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Award, Target, Calendar } from 'lucide-react';
import { isCurrentTradingWeek } from '../utils/dateUtils';

function getWeekRange(date) {
  const d = new Date(date);
  // Get Monday of the week
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  // Get Friday of the week (Monday + 4 days)
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);
  return { start: monday, end: friday };
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getWinRateColor(rate) {
  if (rate >= 65) return '#00e676';
  if (rate >= 50) return '#00e5ff';
  return '#ff1744';
}

export default function WeeklyPerformance({ signals }) {
  // Only take completed (non-active) signals AND they must NOT be in the current trading week
  const completedSignals = useMemo(() => {
    return signals.filter(
      (s) => (s.status === 'WON' || s.status === 'LOST' || s.status === 'TIE')
             && !isCurrentTradingWeek(s.created_at)
    );
  }, [signals]);

  // Group signals by week
  const weeklyData = useMemo(() => {
    const weeks = {};

    completedSignals.forEach((sig) => {
      const { start, end } = getWeekRange(sig.created_at);
      const key = start.toISOString();

      if (!weeks[key]) {
        weeks[key] = {
          startDate: start,
          endDate: end,
          signals: [],
        };
      }
      weeks[key].signals.push(sig);
    });

    // Sort weeks descending (most recent first)
    return Object.values(weeks).sort((a, b) => b.startDate - a.startDate);
  }, [completedSignals]);

  if (completedSignals.length === 0) {
    return (
      <div className="weekly-wrapper">
        <div className="weekly-page-header">
          <BarChart2 size={22} style={{ color: 'var(--accent-blue)' }} />
          <h2>Weekly Performance</h2>
        </div>
        <div className="empty-state">
          <BarChart2 size={48} className="empty-icon" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>No Data Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Weekly stats will appear here once signals are completed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-wrapper">
      <div className="weekly-page-header">
        <BarChart2 size={22} style={{ color: 'var(--accent-blue)' }} />
        <h2>Weekly Performance</h2>
        <span className="weekly-subtitle">Auto-updates every week</span>
      </div>

      <div className="weekly-cards-grid">
        {weeklyData.map((week, idx) => {
          const won = week.signals.filter((s) => s.status === 'WON').length;
          const lost = week.signals.filter((s) => s.status === 'LOST').length;
          const tie = week.signals.filter((s) => s.status === 'TIE').length;
          const total = week.signals.length;
          const decided = won + lost;
          const winRate = decided > 0 ? ((won / decided) * 100).toFixed(1) : '0.0';
          const winRateNum = parseFloat(winRate);
          const winRateColor = getWinRateColor(winRateNum);

          return (
            <div
              key={week.startDate.toISOString()}
              className="weekly-card"
            >
              {/* Card Header */}
              <div className="weekly-card-header">
                <div className="weekly-date-range">
                  <Calendar size={14} style={{ color: 'var(--accent-blue)' }} />
                  <span>{formatDate(week.startDate)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span>{formatDate(week.endDate)}</span>
                </div>
              </div>

              {/* Win Rate Ring */}
              <div className="weekly-winrate-section">
                <div className="winrate-ring-container">
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    {/* Background circle */}
                    <circle
                      cx="55" cy="55" r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="10"
                    />
                    {/* Progress arc */}
                    <circle
                      cx="55" cy="55" r="45"
                      fill="none"
                      stroke={winRateColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - winRateNum / 100)}`}
                      transform="rotate(-90 55 55)"
                      style={{ filter: `drop-shadow(0 0 6px ${winRateColor})`, transition: 'stroke-dashoffset 1s ease' }}
                    />
                    <text x="55" y="50" textAnchor="middle" fill={winRateColor} fontSize="18" fontWeight="800" fontFamily="Outfit, sans-serif">
                      {winRate}%
                    </text>
                    <text x="55" y="68" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="Outfit, sans-serif">
                      Win Rate
                    </text>
                  </svg>
                </div>

                {/* Stats Grid */}
                <div className="weekly-stats-grid">
                  <div className="weekly-stat-box">
                    <Target size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="wstat-value" style={{ color: '#fff' }}>{total}</span>
                    <span className="wstat-label">Total Signals</span>
                  </div>
                  <div className="weekly-stat-box">
                    <TrendingUp size={14} style={{ color: 'var(--accent-call)' }} />
                    <span className="wstat-value" style={{ color: 'var(--accent-call)' }}>{won}</span>
                    <span className="wstat-label">Won</span>
                  </div>
                  <div className="weekly-stat-box">
                    <TrendingDown size={14} style={{ color: 'var(--accent-put)' }} />
                    <span className="wstat-value" style={{ color: 'var(--accent-put)' }}>{lost}</span>
                    <span className="wstat-label">Lost</span>
                  </div>
                  <div className="weekly-stat-box">
                    <Award size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="wstat-value" style={{ color: 'var(--text-secondary)' }}>{tie}</span>
                    <span className="wstat-label">Tie</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="weekly-progress-bar-wrapper">
                <div className="weekly-progress-bar-bg">
                  <div
                    className="weekly-progress-bar-fill won-fill"
                    style={{ width: decided > 0 ? `${(won / decided) * 100}%` : '0%' }}
                  />
                  <div
                    className="weekly-progress-bar-fill lost-fill"
                    style={{ width: decided > 0 ? `${(lost / decided) * 100}%` : '0%', marginLeft: decided > 0 ? `${(won / decided) * 100}%` : '0%', position: 'absolute', top: 0, left: 0 }}
                  />
                </div>
                <div className="weekly-bar-labels">
                  <span style={{ color: 'var(--accent-call)', fontSize: '0.78rem' }}>Won: {decided > 0 ? ((won / decided) * 100).toFixed(0) : 0}%</span>
                  <span style={{ color: 'var(--accent-put)', fontSize: '0.78rem' }}>Lost: {decided > 0 ? ((lost / decided) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
