import { useRef, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedArbitrageFilters } from './ArbitrageFilterContext';
import { fetchScoredListings, type ScoredListing } from './api';
import { arbitrageKeys } from './queryKeys';

function SkeletonLoader() {
  return (
    <div className="table-skeleton">
      <div className="skeleton-header-row">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-cell" />
        ))}
      </div>
      {[...Array(10)].map((_, i) => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="table-error">Error: {message}</div>;
}

const TableHeader = ({
  columns,
  sortConfig,
  onSort,
}: {
  columns: { key: string; label: string; width: number }[];
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}) => (
  <div className="table-header">
    {columns.map((col) => (
      <div
        key={col.key}
        className={`table-header-cell ${col.key === 'actions' ? '' : 'sortable'}`}
        style={{ width: col.width, minWidth: col.width }}
        onClick={() => col.key !== 'actions' && onSort(col.key)}
      >
        {col.label}
        {sortConfig?.key === col.key && (
          <span className="sort-indicator">
            {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
          </span>
        )}
      </div>
    ))}
  </div>
);

const ExpandedRow = ({ data }: { data: ScoredListing }) => (
  <div className="expanded-row">
    <div className="expanded-grid">
      <div className="expanded-item">
        <span className="expanded-label">ID:</span> {data.id}
      </div>
      <div className="expanded-item">
        <span className="expanded-label">Date of Manufacturing:</span>{' '}
        {data.dateOfManufacturing}
      </div>
      <div className="expanded-item">
        <span className="expanded-label">Engine Power:</span> {data.enginePower}{' '}
        hp
      </div>
      <div className="expanded-item">
        <span className="expanded-label">Fuel Type:</span> {data.fuelType}
      </div>
      <div className="expanded-item">
        <span className="expanded-label">Seller Location:</span>{' '}
        {data.sellerLocation}
      </div>
      <div className="expanded-item">
        <span className="expanded-label">Latitude:</span>{' '}
        {data.latitudeCoordinates?.toFixed(4) || 'N/A'}
      </div>
      <div className="expanded-item">
        <span className="expanded-label">Longitude:</span>{' '}
        {data.longitudeCoordinates?.toFixed(4) || 'N/A'}
      </div>
      <div className="expanded-item">
        <span className="expanded-label">Predicted Sell Price:</span> €
        {data.predicted_sell_price.toLocaleString()}
      </div>
    </div>
  </div>
);

export function ArbitrageScoreTable() {
  const containerRef = useRef<HTMLDivElement>(null);
  const filters = useDebouncedArbitrageFilters();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({
    key: 'arbitrage_score',
    direction: 'desc',
  });

  const queryKey = useMemo(
    () => arbitrageKeys.scoredListings(filters),
    [filters],
  );

  const { data, isLoading, error } = useQuery<ScoredListing[]>({
    queryKey,
    queryFn: () => fetchScoredListings(filters),
  });

  const sortedData = useMemo(() => {
    if (!data) return [];
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortConfig.key) {
        case 'manufacturer':
          aVal = a.manufacturer;
          bVal = b.manufacturer;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'mileage':
          aVal = a.mileage;
          bVal = b.mileage;
          break;
        case 'engine_power':
          aVal = a.enginePower;
          bVal = b.enginePower;
          break;
        case 'fuel_type':
          aVal = a.fuelType;
          bVal = b.fuelType;
          break;
        case 'location':
          aVal = a.sellerCountryCode;
          bVal = b.sellerCountryCode;
          break;
        case 'predicted_sell_price':
          aVal = a.predicted_sell_price;
          bVal = b.predicted_sell_price;
          break;
        case 'arbitrage_score':
          aVal = a.arbitrage_score;
          bVal = b.arbitrage_score;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, sortConfig]);

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  }, []);

  const toggleRow = useCallback((id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const columns = [
    { key: 'manufacturer', label: 'Manufacturer', width: 100 },
    { key: 'price', label: 'Price', width: 80 },
    { key: 'mileage', label: 'Mileage', width: 80 },
    { key: 'engine_power', label: 'Engine Power', width: 90 },
    { key: 'fuel_type', label: 'Fuel Type', width: 80 },
    { key: 'location', label: 'Location', width: 60 },
    { key: 'predicted_sell_price', label: 'Pred. Sell Price', width: 100 },
    { key: 'arbitrage_score', label: 'Net Margin', width: 100 },
    { key: 'actions', label: '', width: 50 },
  ];

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data || data.length === 0)
    return <div className="table-empty">No listings available</div>;

  return (
    <div ref={containerRef} className="table-container">
      <TableHeader
        columns={columns}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
      <div className="table-body">
        {sortedData.slice(0, 100).map((item) => (
          <div key={item.id}>
            <div
              className={`table-row ${expandedRows.has(item.id) ? 'expanded' : ''}`}
              onClick={() => toggleRow(item.id)}
            >
              <div className="table-cell" style={{ width: 100, minWidth: 100 }}>
                {item.manufacturer}
              </div>
              <div className="table-cell" style={{ width: 80, minWidth: 80 }}>
                €{item.price.toLocaleString()}
              </div>
              <div className="table-cell" style={{ width: 80, minWidth: 80 }}>
                {item.mileage.toLocaleString()} km
              </div>
              <div className="table-cell" style={{ width: 90, minWidth: 90 }}>
                {item.enginePower} hp
              </div>
              <div className="table-cell" style={{ width: 80, minWidth: 80 }}>
                {item.fuelType}
              </div>
              <div className="table-cell" style={{ width: 60, minWidth: 60 }}>
                {item.sellerCountryCode}
              </div>
              <div className="table-cell" style={{ width: 100, minWidth: 100 }}>
                €{item.predicted_sell_price.toLocaleString()}
              </div>
              <div className="table-cell" style={{ width: 100, minWidth: 100 }}>
                <span
                  className={`margin-badge ${item.arbitrage_score >= 0 ? 'positive' : 'negative'}`}
                >
                  €{item.arbitrage_score.toLocaleString()}
                </span>
              </div>
              <div
                className="table-cell actions-cell"
                style={{ width: 50, minWidth: 50 }}
              >
                <button
                  className="expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(item.id);
                  }}
                >
                  {expandedRows.has(item.id) ? '−' : '+'}
                </button>
              </div>
            </div>
            {expandedRows.has(item.id) && <ExpandedRow data={item} />}
          </div>
        ))}
      </div>
      <div className="table-footer">
        Showing {Math.min(100, sortedData.length)} of {sortedData.length}{' '}
        listings
      </div>
    </div>
  );
}
