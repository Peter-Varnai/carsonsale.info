import { useMemo, useState } from 'react';
import { MapContainer, CircleMarker, Popup } from 'react-leaflet';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { fetchListingsGeo, type ListingGeo } from './api';
import { arbitrageKeys } from './queryKeys';
import 'leaflet/dist/leaflet.css';

function SkeletonLoader() {
  return <div className="map-skeleton">Loading listings...</div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="map-error">Error: {message}</div>;
}

export function ListingMap() {
  const [viewMode, setViewMode] = useState<'pins' | 'heatmap'>('pins');

  const { data, isLoading, error } = useQuery<ListingGeo[]>({
    queryKey: arbitrageKeys.listingsGeo(),
    queryFn: fetchListingsGeo,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(
      (d) => d.latitude_coordinates && d.longitude_coordinates,
    );
  }, [data]);

  const colorScale = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return d3
        .scaleSequential<string>()
        .domain([0, 1])
        .interpolator(d3.interpolateGreens);
    }

    const margins = filteredData.map((d) => d.margin_estimate);
    const sortedMargins = [...margins].sort((a, b) => a - b);
    const p95 = sortedMargins[Math.floor(sortedMargins.length * 0.95)] || 1;

    return d3
      .scaleSequential<string>()
      .domain([0, Math.max(0, p95)])
      .interpolator((t) => {
        if (t < 0.5) {
          return d3.interpolateGreys(t * 2);
        }
        return d3.interpolateYlGn(t * 2 - 1);
      });
  }, [filteredData]);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data || data.length === 0)
    return <div className="map-empty">No listings available</div>;

  return (
    <div className="listing-map-container">
      <div className="map-controls">
        <button
          className={`view-toggle-btn ${viewMode === 'pins' ? 'active' : ''}`}
          onClick={() => setViewMode('pins')}
        >
          Pins
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
          onClick={() => setViewMode('heatmap')}
        >
          Heatmap
        </button>
      </div>
      <div className="map-container" style={{ height: '400px', width: '100%' }}>
        <MapContainer
          center={[48.5, 17.0]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          {filteredData.slice(0, 500).map((listing) => (
            <CircleMarker
              key={listing.id}
              center={[
                listing.latitude_coordinates,
                listing.longitude_coordinates,
              ]}
              radius={6}
              pathOptions={{
                fillColor: colorScale(Math.max(0, listing.margin_estimate)),
                fillOpacity: 0.8,
                color: '#333',
                weight: 1,
              }}
            >
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong>{listing.manufacturer}</strong>
                  <br />
                  Price: €{listing.price.toLocaleString()}
                  <br />
                  Margin: €{listing.margin_estimate.toLocaleString()}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="map-legend">
        <span>Low</span>
        <div className="legend-gradient" />
        <span>High</span>
      </div>
    </div>
  );
}
