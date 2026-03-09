import { useArbitrageFilters } from './ArbitrageFilterContext';

const COUNTRIES = [
  { code: '', label: 'All Countries' },
  { code: 'AT', label: 'Austria' },
  { code: 'DE', label: 'Germany' },
  { code: 'PL', label: 'Poland' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'HU', label: 'Hungary' },
  { code: 'SK', label: 'Slovakia' },
  { code: 'CZ', label: 'Czechia' },
];

const MANUFACTURERS = [
  { code: '', label: 'All Manufacturers' },
  { code: 'audi', label: 'Audi' },
  { code: 'bmw', label: 'BMW' },
  { code: 'mercedes', label: 'Mercedes' },
  { code: 'volkswagen', label: 'Volkswagen' },
  { code: 'ford', label: 'Ford' },
  { code: 'opel', label: 'Opel' },
];

const FUEL_TYPES = [
  { code: '', label: 'All Fuel Types' },
  { code: 'petrol', label: 'Petrol' },
  { code: 'diesel', label: 'Diesel' },
  { code: 'electric', label: 'Electric' },
  { code: 'hybrid', label: 'Hybrid' },
];

const MILEAGE_BRACKETS = [
  { code: '', label: 'All Mileage' },
  { code: '0-50k', label: '0-50k km' },
  { code: '50k-100k', label: '50k-100k km' },
  { code: '100k-150k', label: '100k-150k km' },
  { code: '150k+', label: '150k+ km' },
];

export function ArbitrageFilterPanel() {
  const { filters, setFilters, resetFilters } = useArbitrageFilters();

  return (
    <div className="arbitrage-filter-panel">
      <div className="filter-group">
        <label>Manufacturer</label>
        <select
          value={filters.manufacturer || ''}
          onChange={(e) =>
            setFilters({ manufacturer: e.target.value || undefined })
          }
        >
          {MANUFACTURERS.map((m) => (
            <option key={m.code} value={m.code}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Fuel Type</label>
        <select
          value={filters.fuel_type || ''}
          onChange={(e) =>
            setFilters({ fuel_type: e.target.value || undefined })
          }
        >
          {FUEL_TYPES.map((f) => (
            <option key={f.code} value={f.code}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Mileage Max</label>
        <input
          type="range"
          min="0"
          max="300000"
          step="10000"
          value={filters.mileage_max || 300000}
          onChange={(e) =>
            setFilters({ mileage_max: parseInt(e.target.value) })
          }
        />
        <span className="filter-value">
          {(filters.mileage_max || 300000).toLocaleString()} km
        </span>
      </div>

      <div className="filter-group">
        <label>Mileage Bracket</label>
        <select
          value={filters.mileage_bracket || ''}
          onChange={(e) =>
            setFilters({ mileage_bracket: e.target.value || undefined })
          }
        >
          {MILEAGE_BRACKETS.map((m) => (
            <option key={m.code} value={m.code}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Engine Power (hp)</label>
        <div className="range-inputs">
          <input
            type="number"
            placeholder="Min"
            value={filters.engine_power_min || ''}
            onChange={(e) =>
              setFilters({
                engine_power_min: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.engine_power_max || ''}
            onChange={(e) =>
              setFilters({
                engine_power_max: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Source Country</label>
        <select
          value={filters.source_country || ''}
          onChange={(e) =>
            setFilters({ source_country: e.target.value || undefined })
          }
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Target Country</label>
        <select
          value={filters.target_country || ''}
          onChange={(e) =>
            setFilters({ target_country: e.target.value || undefined })
          }
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Country A</label>
        <select
          value={filters.country_a || 'DE'}
          onChange={(e) => setFilters({ country_a: e.target.value || 'DE' })}
        >
          {COUNTRIES.slice(1).map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Country B</label>
        <select
          value={filters.country_b || 'PL'}
          onChange={(e) => setFilters({ country_b: e.target.value || 'PL' })}
        >
          {COUNTRIES.slice(1).map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <button className="reset-btn" onClick={resetFilters}>
        Reset Filters
      </button>
    </div>
  );
}
