import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedArbitrageFilters } from './ArbitrageFilterContext';
import { fetchPowerPriceByCountry, type PowerPriceResult } from './api';
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

function SkeletonLoader() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-lines" />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="chart-error">Error: {message}</div>;
}

export function EnginePowerPriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const filters = useDebouncedArbitrageFilters();

  const queryKey = useMemo(
    () => arbitrageKeys.powerPriceByCountry(filters),
    [filters],
  );

  const { data, isLoading, error } = useQuery<PowerPriceResult[]>({
    queryKey,
    queryFn: () => fetchPowerPriceByCountry(filters),
  });

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((countryData) => {
      const buckets = (countryData.buckets || [])
        .filter((b) => b.avg_price > 0)
        .map((b) => ({
          powerMin: b.power_min,
          powerMax: b.power_max,
          powerMid: (b.power_min + b.power_max) / 2,
          avgPrice: b.avg_price,
        }))
        .sort((a, b) => a.powerMid - b.powerMid);

      return {
        country: countryData.country,
        buckets,
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

    const allBuckets = processedData.flatMap((d) => d.buckets);
    const minPower = d3.min(allBuckets, (d) => d.powerMid) || 50;
    const maxPower = d3.max(allBuckets, (d) => d.powerMid) || 300;
    const maxPrice = d3.max(allBuckets, (d) => d.avgPrice) || 50000;

    const x = d3
      .scaleLinear()
      .domain([minPower - 20, maxPower + 20])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, maxPrice * 1.1])
      .range([innerHeight, 0]);

    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'line-tooltip')
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
          .tickFormat((d) => `${d}hp`),
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
      .text('Engine Power (hp)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Average Price (€)');

    const line = d3
      .line<{ powerMid: number; avgPrice: number }>()
      .x((d) => x(d.powerMid))
      .y((d) => y(d.avgPrice))
      .curve(d3.curveMonotoneX);

    processedData.forEach((countryData) => {
      g.append('path')
        .datum(countryData.buckets)
        .attr('fill', 'none')
        .attr('stroke', countryData.color)
        .attr('stroke-width', 2)
        .attr('d', line);

      g.selectAll(`.dot-${countryData.country}`)
        .data(countryData.buckets)
        .enter()
        .append('circle')
        .attr('class', `dot-${countryData.country}`)
        .attr('cx', (d) => x(d.powerMid))
        .attr('cy', (d) => y(d.avgPrice))
        .attr('r', 4)
        .attr('fill', countryData.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .on('mouseover', function (event, d) {
          d3.select(this).attr('r', 6);
          tooltip.transition().duration(200).style('opacity', 1);
          tooltip
            .html(
              `<strong>${countryData.country}</strong><br/>
              Power: ${d.powerMin}-${d.powerMax} hp<br/>
              Avg Price: €${d.avgPrice.toLocaleString()}`,
            )
            .style('left', `${event.offsetX + 10}px`)
            .style('top', `${event.offsetY - 10}px`);
        })
        .on('mouseout', function () {
          d3.select(this).attr('r', 4);
          tooltip.transition().duration(200).style('opacity', 0);
        });
    });

    const verticalGuide = g
      .append('line')
      .attr('class', 'vertical-guide')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const tooltipBox = d3
      .select(container)
      .append('div')
      .attr('class', 'multi-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px');

    svg
      .append('rect')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event, g.node());
        const powerValue = x.invert(mx);

        if (powerValue < minPower - 20 || powerValue > maxPower + 20) {
          verticalGuide.style('opacity', 0);
          tooltipBox.style('opacity', 0);
          return;
        }

        verticalGuide
          .attr('x1', x(powerValue))
          .attr('x2', x(powerValue))
          .style('opacity', 1);

        let tooltipHtml = `<strong>${Math.round(powerValue)} hp</strong><br/>`;
        processedData.forEach((countryData) => {
          const closest = countryData.buckets.reduce((prev, curr) =>
            Math.abs(curr.powerMid - powerValue) <
            Math.abs(prev.powerMid - powerValue)
              ? curr
              : prev,
          );
          tooltipHtml += `<span style="color:${countryData.color}">${countryData.country}</span>: €${closest.avgPrice.toLocaleString()}<br/>`;
        });

        tooltipBox
          .html(tooltipHtml)
          .style('left', `${event.offsetX + 15}px`)
          .style('top', `${event.offsetY + 15}px`)
          .style('opacity', 1);
      })
      .on('mouseout', function () {
        verticalGuide.style('opacity', 0);
        tooltipBox.style('opacity', 0);
      });

    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - 140}, ${margin.top})`);

    processedData.forEach((countryData, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow
        .append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', countryData.color)
        .attr('stroke-width', 2);

      legendRow
        .append('text')
        .attr('x', 20)
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
      .text('Engine Power vs Average Price by Country');

    return () => {
      tooltip.remove();
      tooltipBox.remove();
    };
  }, [processedData]);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data || data.length === 0)
    return <div className="chart-empty">No power-price data available</div>;

  return (
    <div ref={containerRef} className="chart-container">
      <svg ref={svgRef} />
    </div>
  );
}
