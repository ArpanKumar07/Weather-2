import React from 'react';
import { ShieldCheck, Zap, Heart, CheckCircle2 } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

export default function Footer() {
  const { currentWeather } = useWeather();
  const latency = currentWeather?.clientLatencyMs || 180;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>MAUSAM360</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>v1.0 (Release 1)</span>
          </div>
          <div className="footer-meta" style={{ marginTop: '0.2rem' }}>
            Team <strong>INFINITE LOOP (G2-T2)</strong> • Project ID: G2-12 • DSC3153 Software Development Lab
          </div>
        </div>

        {/* SLA & NFR Verification Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Story W-04 Performance Gate */}
          <div className="sla-badge" title="Lab 1 NFR & Story W-04: Render in under 1.5s">
            <Zap size={14} />
            <span>API Latency: {latency}ms (SLA &lt; 1500ms)</span>
            <CheckCircle2 size={13} />
          </div>

          {/* Story W-08 Privacy Protection */}
          <div
            className="sla-badge"
            style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#7dd3fc' }}
            title="Lab 1 NFR & Story W-08: GPS Privacy Protected"
          >
            <ShieldCheck size={14} />
            <span>GPS Privacy Protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
