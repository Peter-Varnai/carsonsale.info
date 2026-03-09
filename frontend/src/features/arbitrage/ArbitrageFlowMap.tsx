import { useEffect, useRef, useState } from 'react';
import { MapContainer, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { fetchFlowData, type FlowDataResult } from './api';
import { arbitrageKeys } from './queryKeys';
import 'leaflet/dist/leaflet.css';

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  AT: [47.5, 14.5],
  DE: [51.2, 10.4],
  PL: [51.9, 19.1],
  CH: [46.8, 8.2],
  HU: [47.2, 19.5],
  SK: [48.7, 19.7],
  CZ: [49.8, 15.5],
};

function SkeletonLoader() {
  return <div className="map-skeleton">Loading map...</div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="map-error">Error: {message}</div>;
}

function FlowArrows({ data }: { data: FlowDataResult[] }) {
  const map = useMap();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    data: FlowDataResult;
  } | null>(null);

  useEffect(() => {
    if (!map || !svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const maxCount = d3.max(data, (d) => d.opportunity_count) || 1;
    const maxMargin = d3.max(data, (d) => d.avg_net_margin) || 1;

    const width = map.getSize().x;
    const height = map.getSize().y;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('class', 'flow-arrows');

    data.forEach((flow) => {
      const source = COUNTRY_CENTROIDS[flow.source_country];
      const target = COUNTRY_CENTROIDS[flow.target_country];

      if (!source || !target) return;

      const sourcePoint = map.latLngToLayerPoint([source[0], source[1]]);
      const targetPoint = map.latLngToLayerPoint([target[0], target[1]]);

      const thickness = 2 + (flow.opportunity_count / maxCount) * 8;

      const colorScale = d3
        .scaleLinear<string>()
        .domain([0, maxMargin])
        .range(['#ffd700', '#00aa00']);

      const midLat = (source[0] + target[0]) / 2;
      const midLng = (source[1] + target[1]) / 2;
      const offset = (source[0] - target[0]) * 0.2;
      const controlPoint = map.latLngToLayerPoint([midLat + offset, midLng]);

      const path = d3.path();
      path.moveTo(sourcePoint.x, sourcePoint.y);
      path.quadraticCurveTo(
        controlPoint.x,
        controlPoint.y,
        targetPoint.x,
        targetPoint.y,
      );

      const pathEl = g
        .append('path')
        .attr('d', path.toString())
        .attr('fill', 'none')
        .attr('stroke', colorScale(flow.avg_net_margin))
        .attr('stroke-width', thickness)
        .attr('stroke-opacity', 0.7)
        .attr('marker-end', 'url(#arrowhead)')
        .style('cursor', 'pointer');

      pathEl.on('mouseover', function (event: MouseEvent) {
        d3.select(this)
          .attr('stroke-opacity', 1)
          .attr('stroke-width', thickness + 2);
        const [x, y] = d3.pointer(event, svg.node());
        setTooltipData({ x, y, data: flow });
      });

      pathEl.on('mouseout', function () {
        d3.select(this)
          .attr('stroke-opacity', 0.7)
          .attr('stroke-width', thickness);
        setTooltipData(null);
      });
    });

    g.append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');

    return () => {
      svg.selectAll('*').remove();
    };
  }, [map, data]);

  return (
    <>
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 500,
        }}
      />
      {tooltipData && (
        <div
          style={{
            position: 'absolute',
            left: tooltipData.x + 10,
            top: tooltipData.y - 10,
            background: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            zIndex: 1000,
            pointerEvents: 'none',
            fontSize: '12px',
          }}
        >
          <strong>
            {tooltipData.data.source_country} →{' '}
            {tooltipData.data.target_country}
          </strong>
          <br />
          {tooltipData.data.opportunity_count} opportunities
          <br />
          Avg margin: €{tooltipData.data.avg_net_margin.toLocaleString()}
        </div>
      )}
    </>
  );
}

function CountryMarkers() {
  return (
    <>
      {Object.entries(COUNTRY_CENTROIDS).map(([code, position]) => (
        <CircleMarker
          key={code}
          center={position}
          radius={6}
          pathOptions={{
            fillColor: '#377eb8',
            fillOpacity: 0.8,
            color: '#fff',
            weight: 2,
          }}
        >
          <Tooltip direction="top" permanent>
            <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{code}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}

export function ArbitrageFlowMap() {
  const { data, isLoading, error } = useQuery<FlowDataResult[]>({
    queryKey: arbitrageKeys.flowData(),
    queryFn: fetchFlowData,
  });

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data || data.length === 0)
    return <div className="map-empty">No flow data available</div>;

  return (
    <div
      className="map-container"
      style={{ height: '400px', width: '100%', position: 'relative' }}
    >
      <MapContainer
        center={[48.5, 17.0]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <CountryMarkers />
        <FlowArrows data={data} />
      </MapContainer>
    </div>
  );
}
