import React, { useState } from 'react';

const CASES = [
  {
    id: 'dharamsala-2021',
    label: 'Dharamsala 2021',
    date: '22 Jul 2021',
    region: 'Kangra, Himachal Pradesh',
    event: 'Cloudburst + Flash Flood',
    observed: '187 mm / 6 hr',
    predicted: '74% (T+4h)',
    lead: 'T+4h',
    csi: 0.71,
    pod: 0.88,
    far: 0.19,
    casualties: 14,
    outcome: 'SUCCESS',
    steps: [
      { num: '01', label: 'EVENT', val: '22 Jul 2021 · 14:30 IST' },
      { num: '02', label: 'OBSERVED', val: 'IWV 68 mm · CAPE 3200 J/kg · CTT −18°C/hr' },
      { num: '03', label: 'MODEL', val: 'CB Probability 74% at T+4h' },
      { num: '04', label: 'LEAD TIME', val: '4 hours 12 minutes' },
      { num: '05', label: 'ACTUAL ONSET', val: '18:42 IST · 187 mm/6h' },
      { num: '06', label: 'OUTCOME', val: 'Alert issued T−4h. Partial evacuation completed.' },
    ],
  },
  {
    id: 'wayanad-2024',
    label: 'Wayanad 2024',
    date: '30 Jul 2024',
    region: 'Wayanad, Kerala',
    event: 'Extreme Cloudburst + Landslide Trigger',
    observed: '228 mm / 6 hr',
    predicted: '81% (T+3h)',
    lead: 'T+3h',
    csi: 0.68,
    pod: 0.91,
    far: 0.22,
    casualties: 412,
    outcome: 'PARTIAL',
    steps: [
      { num: '01', label: 'EVENT', val: '30 Jul 2024 · 01:00 IST' },
      { num: '02', label: 'OBSERVED', val: 'IWV 74 mm · CAPE 3800 J/kg · CTT −21°C/hr' },
      { num: '03', label: 'MODEL', val: 'CB Probability 81% at T+3h' },
      { num: '04', label: 'LEAD TIME', val: '3 hours' },
      { num: '05', label: 'ACTUAL ONSET', val: '04:00 IST · 228 mm/6h' },
      { num: '06', label: 'OUTCOME', val: 'Catastrophic. Warning gap demonstrates need for VAYUNET.' },
    ],
  },
  {
    id: 'uttarkashi-2023',
    label: 'Uttarkashi 2023',
    date: '10 Aug 2023',
    region: 'Uttarkashi, Uttarakhand',
    event: 'Multi-nullah Flash Flood',
    observed: '142 mm / 3 hr',
    predicted: '69% (T+5h)',
    lead: 'T+5h',
    csi: 0.64,
    pod: 0.82,
    far: 0.25,
    casualties: 19,
    outcome: 'SUCCESS',
    steps: [
      { num: '01', label: 'EVENT', val: '10 Aug 2023 · 09:15 IST' },
      { num: '02', label: 'OBSERVED', val: 'IWV 61 mm · CAPE 2700 J/kg · CTT −15°C/hr' },
      { num: '03', label: 'MODEL', val: 'FF Probability 69% at T+5h' },
      { num: '04', label: 'LEAD TIME', val: '5 hours 8 minutes' },
      { num: '05', label: 'ACTUAL ONSET', val: '14:23 IST · 142 mm/3h' },
      { num: '06', label: 'OUTCOME', val: 'Pre-positioned SDRF. 6 villages evacuated.' },
    ],
  },
  {
    id: 'mumbai-2022',
    label: 'Mumbai 2022',
    date: '19 Sep 2022',
    region: 'Greater Mumbai, Maharashtra',
    event: 'Urban Thunderstorm + Waterlogging',
    observed: '118 mm / 4 hr',
    predicted: '63% (T+2h)',
    lead: 'T+2h',
    csi: 0.59,
    pod: 0.76,
    far: 0.29,
    casualties: 0,
    outcome: 'SUCCESS',
    steps: [
      { num: '01', label: 'EVENT', val: '19 Sep 2022 · 17:00 IST' },
      { num: '02', label: 'OBSERVED', val: 'IWV 66 mm · CAPE 2400 J/kg · CTT −14°C/hr' },
      { num: '03', label: 'MODEL', val: 'TS Probability 63% at T+2h' },
      { num: '04', label: 'LEAD TIME', val: '2 hours 5 minutes' },
      { num: '05', label: 'ACTUAL ONSET', val: '19:05 IST · 118 mm/4h' },
      { num: '06', label: 'OUTCOME', val: 'BMC pre-emptive pump activation. Zero casualties.' },
    ],
  },
];

export default function ForensicsView() {
  const [activeId, setActiveId] = useState('dharamsala-2021');
  const c = CASES.find(x => x.id === activeId);

  const outcomeColor = c.outcome === 'SUCCESS' ? 'var(--sev-low)' : 'var(--sev-moderate)';

  return (
    <div className="forensics-layout">
      {/* Header */}
      <div className="forensics-header-row">
        <div className="forensics-title-block">
          <h2>Historical Event Forensics</h2>
          <p>ECMWF-style verification · Model skill assessment against benchmark disaster events</p>
        </div>
        <div className="case-selector">
          {CASES.map(c => (
            <button
              key={c.id}
              className={`case-btn ${activeId === c.id ? 'active' : ''}`}
              onClick={() => setActiveId(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Case meta */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '16px 20px',
        display: 'flex',
        gap: 32,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'REGION',   val: c.region },
          { label: 'DATE',     val: c.date },
          { label: 'EVENT',    val: c.event },
          { label: 'OBSERVED', val: c.observed },
          { label: 'PREDICTED', val: c.predicted },
          { label: 'LEAD TIME', val: c.lead },
          { label: 'CASUALTIES', val: c.casualties },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.8px', marginBottom: 3 }}>
              {f.label}
            </div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {f.val}
            </div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 3 }}>OUTCOME</div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: outcomeColor }}>
            ● {c.outcome}
          </div>
        </div>
      </div>

      {/* Investigation flow — ECMWF verification timeline */}
      <div className="investigation-flow">
        <div className="inv-flow-header">
          <h3>Investigation Sequence — Event → Model → Verification</h3>
        </div>
        <div className="inv-flow-steps">
          {c.steps.map(s => (
            <div key={s.num} className="inv-step">
              <div className="inv-step-num">{s.num}</div>
              <div className="inv-step-label">{s.label}</div>
              <div className="inv-step-val">{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification metrics */}
      <div className="verification-table">
        <div className="vtable-header">
          <h3>Forecast Skill Verification — {c.label}</h3>
        </div>
        <table className="forensics-metrics">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Benchmark</th>
              <th>Assessment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CSI — Critical Success Index</td>
              <td style={{ color: 'var(--text-primary)' }}>{c.csi.toFixed(2)}</td>
              <td>IMD baseline: 0.42</td>
              <td>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: c.csi > 0.5 ? 'var(--sev-low)' : 'var(--sev-moderate)', fontWeight: 600 }}>
                  {c.csi > 0.6 ? '↑ SUPERIOR' : '↑ IMPROVED'}
                </span>
              </td>
            </tr>
            <tr>
              <td>POD — Probability of Detection</td>
              <td style={{ color: 'var(--text-primary)' }}>{c.pod.toFixed(2)}</td>
              <td>Target: &gt; 0.75</td>
              <td>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--sev-low)', fontWeight: 600 }}>
                  ↑ MET
                </span>
              </td>
            </tr>
            <tr>
              <td>FAR — False Alarm Ratio</td>
              <td style={{ color: 'var(--text-primary)' }}>{c.far.toFixed(2)}</td>
              <td>Target: &lt; 0.30</td>
              <td>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--sev-low)', fontWeight: 600 }}>
                  ↑ MET
                </span>
              </td>
            </tr>
            <tr>
              <td>Lead Time</td>
              <td style={{ color: 'var(--text-primary)' }}>{c.lead}</td>
              <td>IMD DWR: T+15–30 min</td>
              <td>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--sev-low)', fontWeight: 600 }}>
                  ↑ 8–20× IMPROVEMENT
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
