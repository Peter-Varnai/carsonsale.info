import './ArbitrageLegend.css';

export const ArbitrageLegend = () => {
  return (
    <div className="arbitrage-legend">
      <div className="legend-title">Car Count</div>
      <div className="legend-gradient">
        <span className="legend-label low">Few</span>
        <span className="legend-label high">Many</span>
      </div>
    </div>
  );
};
