import { ArbitrageFilterProvider } from './ArbitrageFilterContext';
import { ArbitrageFilterPanel } from './ArbitrageFilterPanel';
import { CountryPairMatrix } from './CountryPairMatrix';
import { ArbitrageScoreTable } from './ArbitrageScoreTable';
import { PriceDistributionOverlay } from './PriceDistributionOverlay';
import { MileagePriceRegressionChart } from './MileagePriceRegressionChart';
import { EnginePowerPriceChart } from './EnginePowerPriceChart';
import { ArbitrageFlowMap } from './ArbitrageFlowMap';
import { ListingMap } from './ListingMap';
import './ArbitrageDashboard.css';

function DashboardContent() {
  return (
    <div className="arbitrage-dashboard">
      <h1 className="dashboard-title">Price Arbitrage Dashboard</h1>

      <ArbitrageFilterPanel />

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <h2>Country Pair Price Delta Matrix</h2>
          <CountryPairMatrix />
        </section>

        <section className="dashboard-section">
          <h2>Price Distribution Comparison</h2>
          <PriceDistributionOverlay />
        </section>

        <section className="dashboard-section">
          <h2>Mileage vs Price Regression</h2>
          <MileagePriceRegressionChart />
        </section>

        <section className="dashboard-section">
          <h2>Engine Power vs Price</h2>
          <EnginePowerPriceChart />
        </section>

        <section className="dashboard-section">
          <h2>Arbitrage Flow Map</h2>
          <ArbitrageFlowMap />
        </section>

        <section className="dashboard-section">
          <h2>Listings Map</h2>
          <ListingMap />
        </section>

        <section className="dashboard-section full-width">
          <h2>Scored Listings</h2>
          <ArbitrageScoreTable />
        </section>
      </div>
    </div>
  );
}

export function ArbitrageDashboard() {
  return (
    <ArbitrageFilterProvider>
      <DashboardContent />
    </ArbitrageFilterProvider>
  );
}
