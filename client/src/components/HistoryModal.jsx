import React, { useEffect, useState } from 'react';
import { X, History, Database, Calendar } from 'lucide-react';
import { getWeatherHistory } from '../services/api';
import { useWeather } from '../context/WeatherContext';

export default function HistoryModal() {
  const { historyLocation, setHistoryLocation, convertTemp } = useWeather();
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!historyLocation) return;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);
        const data = await getWeatherHistory(historyLocation.location_id, 24);
        setHistoryRecords(data);
      } catch (err) {
        setError(err.message || 'Failed to load historical database records.');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [historyLocation]);

  if (!historyLocation) return null;

  return (
    <div className="modal-overlay" onClick={() => setHistoryLocation(null)}>
      <div
        className="modal-content"
        style={{ maxWidth: '560px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={() => setHistoryLocation(null)}
          title="Close"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div className="metric-icon-box">
            <Database size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Database Weather History
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Relational records for {historyLocation.city_name} (Story W-02)
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            Fetching historical database rows...
          </div>
        ) : error ? (
          <div className="alert-error">{error}</div>
        ) : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            No prior weather entries stored for this location yet.
          </div>
        ) : (
          <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {historyRecords.map((rec, i) => (
              <div
                key={`${rec.recorded_at}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={16} color="var(--theme-accent)" />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                      {new Date(rec.recorded_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rec.condition_text}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                    {convertTemp(rec.temperature)}°
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {rec.humidity}% hum
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
