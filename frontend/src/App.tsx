import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ArbitrageDashboard } from './features/arbitrage/ArbitrageDashboard';
import { ArbitrageMap } from './components/ArbitrageMap/ArbitrageMap';
import { ArbitrageControls } from './components/ArbitrageMap/ArbitrageControls';
import { ArbitrageLegend } from './components/ArbitrageMap/ArbitrageLegend';
import { useState } from 'react';
import './App.css';

function HomePage() {
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([
    'audi',
  ]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);

  return (
    <div className="app">
      <ArbitrageControls
        selectedManufacturers={selectedManufacturers}
        onManufacturersChange={setSelectedManufacturers}
        selectedFuelTypes={selectedFuelTypes}
        onFuelTypesChange={setSelectedFuelTypes}
      />
      <ArbitrageMap
        manufacturers={selectedManufacturers}
        fuelTypes={selectedFuelTypes}
      />
      <ArbitrageLegend />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <nav className="app-nav">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/arbitrage" className="nav-link">
          Arbitrage Dashboard
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/arbitrage" element={<ArbitrageDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
