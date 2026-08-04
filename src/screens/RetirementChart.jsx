import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Ported from finance-app-latest.jsx's RetirementChart — same math and visual
// design, bundled as a real dependency instead of a runtime CDN <script> load
// (a PWA can't depend on fetching a script live once it's offline).
export default function RetirementChart({ cfg, calc }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!calc || !canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    const r = cfg.annualReturn / 100, mR = r / 12;
    const ages = [], accum = [], preserve = [], spendDown = [];
    for (let age = cfg.currentAge; age <= cfg.retireAge; age++) {
      const yrs = age - cfg.currentAge, mo = yrs * 12;
      const val = Math.round(cfg.startAmount * Math.pow(1 + r, yrs) + (mR > 0 ? cfg.monthlyContrib * ((Math.pow(1 + mR, mo) - 1) / mR) : cfg.monthlyContrib * mo));
      ages.push(age); accum.push(val);
      preserve.push(age === cfg.retireAge ? val : null);
      spendDown.push(age === cfg.retireAge ? val : null);
    }
    let pb = calc.total, sb = calc.total;
    for (let age = cfg.retireAge + 1; age <= 100; age++) {
      ages.push(age); accum.push(null);
      pb = pb * (1 + r) - calc.annualWithdrawal4; preserve.push(Math.round(Math.max(0, pb)));
      sb = sb * (1 + r) - calc.spendDownMonthly * 12; spendDown.push(Math.round(Math.max(0, sb)));
    }
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: ages,
        datasets: [
          { label: 'Accumulation', data: accum, borderColor: '#3B6D11', backgroundColor: 'rgba(59,109,17,0.08)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.3, spanGaps: false },
          { label: cfg.withdrawal + '% withdrawal', data: preserve, borderColor: '#185FA5', backgroundColor: 'rgba(24,95,165,0.06)', borderWidth: 2, borderDash: [5, 3], pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.3, spanGaps: false },
          { label: 'Spend down to $100k', data: spendDown, borderColor: '#534AB7', backgroundColor: 'rgba(83,74,183,0.06)', borderWidth: 2, borderDash: [2, 3], pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.3, spanGaps: false },
          { label: 'You are here', data: ages.map((_, i) => (i === 0 ? accum[i] : null)), borderColor: '#D85A30', backgroundColor: '#D85A30', pointRadius: ages.map((_, i) => (i === 0 ? 7 : 0)), showLine: false, spanGaps: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { title: (i) => `Age ${i[0].label}`, label: (i) => (i.raw === null ? null : ` ${i.dataset.label}: $${Math.round(i.raw).toLocaleString()}`) } } },
        scales: {
          x: { ticks: { color: '#888780', font: { size: 11 }, maxTicksLimit: 10, callback: (v, i) => (ages[i] % 10 === 0 || ages[i] === cfg.currentAge || ages[i] === cfg.retireAge ? ages[i] : '') }, grid: { color: 'rgba(136,135,128,0.12)' } },
          y: { ticks: { color: '#888780', font: { size: 11 }, callback: (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : '$' + v) }, grid: { color: 'rgba(136,135,128,0.12)' } },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [cfg, calc]);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
        {['#3B6D11', '#185FA5', '#534AB7'].map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 18, height: 3, background: c, borderRadius: 2, display: 'inline-block' }} />
            {['Accumulation', cfg.withdrawal + '% withdrawal', 'Spend down'][i]}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#D85A30', display: 'inline-block' }} />
          You are here
        </span>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 260 }}><canvas ref={canvasRef} /></div>
    </>
  );
}
