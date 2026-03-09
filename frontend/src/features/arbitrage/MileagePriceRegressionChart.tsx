import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedArbitrageFilters } from './ArbitrageFilterContext';
import { fetchRegressionData, type RegressionDataResult } from './api';
import { arbitrageKeys } from './queryKeys';

const COUNTRY_COLORS: Record<string, string> = {
  AT: '#4daf4a',
  DE: '#377eb8',
  PL: '#ff7f00',
  CH: '#984ea3',
  HU: '#e41a1c',
  SK: '#a65628',
  CZ: '#f781bf',
};

function linearRegression(points: { mileage: number; price: number }[]): {
  slope: number;
  intercept: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  const sumX = d3.sum(points, (d) => d.mileage);
  const sumY = d3.sum(points, (d) => d.price);
  const sumXY = d3.sum(points, (d) => d.mileage * d.price);
  const sumXX = d3.sum(points, (d) => d.mileage * d.mileage);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function SkeletonLoader() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-scatter" />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="chart-error">Error: {message}</div>;
}

export function MileagePriceRegressionChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const filters = useDebouncedArbitrageFilters();

  const queryKey = useMemo(
    () => arbitrageKeys.regressionData(filters),
    [filters],
  );

  const { data, isLoading, error } = useQuery<RegressionDataResult[]>({
    queryKey,
    queryFn: () => fetchRegressionData(filters),
  });

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((countryData) => {
      const points = countryData.points || [];
      const regression = linearRegression(points);
      return {
        country: countryData.country,
        points,
        regression,
        color: COUNTRY_COLORS[countryData.country] || '#999',
      };
    });
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || processedData.length === 0)
      return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 150, bottom: 50, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const allPoints = processedData.flatMap((d) => d.points);
    const maxMileage = d3.max(allPoints, (d) => d.mileage) || 100000;
    const maxPrice = d3.max(allPoints, (d) => d.price) || 50000;

    const x = d3
      .scaleLinear()
      .domain([0, maxMileage * 1.05])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, maxPrice * 1.1])
      .range([innerHeight, 0]);

    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'scatter-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px');

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(8)
          .tickFormat((d) => `${d3.format('.0s')(d as number)}km`),
      )
      .selectAll('text')
      .style('font-size', '11px');

    g.append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(6)
          .tickFormat((d) => `€${d3.format('.0s')(d as number)}`),
      )
      .selectAll('text')
      .style('font-size', '11px');

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Mileage');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Price (€)');

    processedData.forEach((countryData) => {
      g.selectAll(`.point-${countryData.country}`)
        .data(countryData.points)
        .enter()
        .append('circle')
        .attr('class', `point-${countryData.country}`)
        .attr('cx', (d) => x(d.mileage))
        .attr('cy', (d) => y(d.price))
        .attr('r', 4)
        .attr('fill', countryData.color)
        .attr('fill-opacity', 0.6)
        .attr('stroke', countryData.color)
        .attr('stroke-width', 1)
        .on('mouseover', function (event, d) {
          d3.select(this).attr('r', 6).attr('fill-opacity', 1);
          tooltip.transition().duration(200).style('opacity', 1);
          tooltip
            .html(
              `<strong>${countryData.country}</strong><br/>
              Mileage: ${d.mileage.toLocaleString()} km<br/>
              Price: €${d.price.toLocaleString()}`,
            )
            .style('left', `${event.offsetX + 10}px`)
            .style('top', `${event.offsetY - 10}px`);
        })
        .on('mouseout', function () {
          d3.select(this).attr('r', 4).attr('fill-opacity', 0.6);
          tooltip.transition().duration(200).style('opacity', 0);
        });
    });

    processedData.forEach((countryData) => {
      const { slope, intercept } = countryData.regression;
      const x1 = 0;
      const y1 = intercept;
      const x2 = maxMileage;
      const y2 = slope * x2 + intercept;

      g.append('line')
        .attr('x1', x(x1))
        .attr('x2', x(x2))
        .attr('y1', y(Math.max(0, y1)))
        .attr('y2', y(Math.max(0, y2)))
        .attr('stroke', countryData.color)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8)
        .attr('stroke-dasharray', '4,4');
    });

    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - 140}, ${margin.top})`);

    processedData.forEach((countryData, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('circle').attr('r', 5).attr('fill', countryData.color);

      legendRow
        .append('text')
        .attr('x', 10)
        .attr('y', 4)
        .style('font-size', '11px')
        .text(countryData.country);
    });

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Mileage vs Price Regression by Country');

    return () => {
      tooltip.remove();
    };
  }, [processedData]);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data || data.length === 0)
    return <div className="chart-empty">No regression data available</div>;

  return (
    <div ref={containerRef} className="chart-container">
      <svg ref={svgRef} />
    </div>
  );
}
