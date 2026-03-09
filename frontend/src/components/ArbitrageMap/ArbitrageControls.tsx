import './ArbitrageControls.css';

interface ArbitrageControlsProps {
  selectedManufacturers: string[];
  onManufacturersChange: (manufacturers: string[]) => void;
  selectedFuelTypes: string[];
  onFuelTypesChange: (fuelTypes: string[]) => void;
}

const MANUFACTURERS = [
  { value: 'audi', label: 'Audi' },
  { value: 'bmw', label: 'BMW' },
  { value: 'mercedes', label: 'Mercedes' },
  { value: 'volkswagen', label: 'Volkswagen' },
  { value: 'skoda', label: 'Skoda' },
  { value: 'seat', label: 'Seat' },
  { value: 'opel', label: 'Opel' },
  { value: 'ford', label: 'Ford' },
];

const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const ArbitrageControls = ({
  selectedManufacturers,
  onManufacturersChange,
  selectedFuelTypes,
  onFuelTypesChange,
}: ArbitrageControlsProps) => {
  const toggleManufacturer = (value: string) => {
    if (selectedManufacturers.includes(value)) {
      onManufacturersChange(selectedManufacturers.filter((m) => m !== value));
    } else {
      onManufacturersChange([...selectedManufacturers, value]);
    }
  };

  const toggleFuelType = (value: string) => {
    if (selectedFuelTypes.includes(value)) {
      onFuelTypesChange(selectedFuelTypes.filter((f) => f !== value));
    } else {
      onFuelTypesChange([...selectedFuelTypes, value]);
    }
  };

  return (
    <div className="arbitrage-controls">
      <div className="control-group">
        <label>Manufacturers</label>
        <div className="chip-container">
          {MANUFACTURERS.map((m) => (
            <button
              key={m.value}
              className={`chip ${selectedManufacturers.includes(m.value) ? 'active' : ''}`}
              onClick={() => toggleManufacturer(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>Fuel Type</label>
        <div className="chip-container">
          {FUEL_TYPES.map((f) => (
            <button
              key={f.value}
              className={`chip ${selectedFuelTypes.includes(f.value) ? 'active' : ''}`}
              onClick={() => toggleFuelType(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
