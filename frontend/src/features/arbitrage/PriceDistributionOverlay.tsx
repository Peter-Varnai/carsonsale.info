import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedArbitrageFilters } from './ArbitrageFilterContext';
import { fetchPriceDistribution, type PriceDistributionResult } from './api';
import { arbitrageKeys } from './queryKeys';

function SkeletonLoader() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-bars" />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="chart-error">Error: {message}</div>;
}

export function PriceDistributionOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const filters = useDebouncedArbitrageFilters();

  const queryKey = useMemo(
    () => arbitrageKeys.priceDistribution(filters),
    [filters],
  );

  const { data, isLoading, error } = useQuery<PriceDistributionResult>({
    queryKey,
    queryFn: () => fetchPriceDistribution(filters),
  });

  const { bucketsA, bucketsB, maxCount, medianA, medianB, delta } =
    useMemo(() => {
      if (!data) {
        return {
          bucketsA: [],
          bucketsB: [],
          maxCount: 0,
          medianA: 0,
          medianB: 0,
          delta: 0,
        };
      }

      const a = data.country_a || [];
      const b = data.country_b || [];

      const allCounts = [...a.map((d) => d.count), ...b.map((d) => d.count)];
      const max = Math.max(...allCounts, 1);

      const pricesA = a.flatMap((d) =>
        Array(d.count).fill((d.bucket_min + d.bucket_max) / 2),
      );
      const pricesB = b.flatMap((d) =>
        Array(d.count).fill((d.bucket_min + d.bucket_max) / 2),
      );

      const medA =
        pricesA.length > 0
          ? pricesA.sort((a, b) => a - b)[Math.floor(pricesA.length / 2)]
          : 0;
      const medB =
        pricesB.length > 0
          ? pricesB.sort((a, b) => a - b)[Math.floor(pricesB.length / 2)]
          : 0;

      const all = [...pricesA, ...pricesB];

      return {
        bucketsA: a,
        bucketsB: b,
        maxCount: max,
        allPrices: all,
        medianA: medA,
        medianB: medB,
        delta: Math.abs(medB - medA),
      };
    }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || bucketsA.length === 0)
      return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 120, bottom: 50, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const minPrice = Math.min(
      ...bucketsA.map((d) => d.bucket_min),
      ...bucketsB.map((d) => d.bucket_min),
    );
    const maxPrice = Math.max(
      ...bucketsA.map((d) => d.bucket_max),
      ...bucketsB.map((d) => d.bucket_max),
    );

    const x = d3
      .scaleLinear()
      .domain([minPrice, maxPrice])
      .range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]);

    const colorA = 'rgba(66, 133, 244, 0.6)';
    const colorB = 'rgba(234, 118, 47, 0.6)';

    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'histogram-tooltip')
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
          .ticks(10)
          .tickFormat((d) => `€${d3.format('.0s')(d as number)}`),
      )
      .selectAll('text')
      .style('font-size', '11px');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '11px');

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Price (€)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Count');

    const barWidth =
      x(bucketsA[0]?.bucket_max || 1000) - x(bucketsA[0]?.bucket_min || 0) - 1;

    g.selectAll('.bar-a')
      .data(bucketsA)
      .enter()
      .append('rect')
      .attr('class', 'bar-a')
      .attr('x', (d) => x(d.bucket_min))
      .attr('y', (d) => y(d.count))
      .attr('width', Math.max(barWidth, 2))
      .attr('height', (d) => innerHeight - y(d.count))
      .attr('fill', colorA)
      .attr('stroke', '#2c5aa0')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill', 'rgba(66, 133, 244, 0.9)');
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(
            `<strong>${filters.country_a}</strong><br/>
            Range: €${d.bucket_min.toLocaleString()} - €${d.bucket_max.toLocaleString()}<br/>
            Count: ${d.count}`,
          )
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', colorA);
        tooltip.transition().duration(200).style('opacity', 0);
      });

    g.selectAll('.bar-b')
      .data(bucketsB)
      .enter()
      .append('rect')
      .attr('class', 'bar-b')
      .attr('x', (d) => x(d.bucket_min))
      .attr('y', (d) => y(d.count))
      .attr('width', Math.max(barWidth, 2))
      .attr('height', (d) => innerHeight - y(d.count))
      .attr('fill', colorB)
      .attr('stroke', '#c45a1f')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill', 'rgba(234, 118, 47, 0.9)');
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(
            `<strong>${filters.country_b}</strong><br/>
            Range: €${d.bucket_min.toLocaleString()} - €${d.bucket_max.toLocaleString()}<br/>
            Count: ${d.count}`,
          )
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', colorB);
        tooltip.transition().duration(200).style('opacity', 0);
      });

    if (medianA > 0) {
      g.append('line')
        .attr('x1', x(medianA))
        .attr('x2', x(medianA))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#2c5aa0')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      g.append('text')
        .attr('x', x(medianA))
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#2c5aa0')
        .style('font-size', '11px')
        .text(`Med: €${d3.format(',')(medianA)}`);
    }

    if (medianB > 0) {
      g.append('line')
        .attr('x1', x(medianB))
        .attr('x2', x(medianB))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#c45a1f')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      g.append('text')
        .attr('x', x(medianB))
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#c45a1f')
        .style('font-size', '11px')
        .text(`Med: €${d3.format(',')(medianB)}`);
    }

    if (delta > 0) {
      const midX = (x(medianA) + x(medianB)) / 2;
      const minY = innerHeight - 40;

      g.append('line')
        .attr('x1', x(medianA))
        .attr('x2', x(medianB))
        .attr('y1', minY)
        .attr('y2', minY)
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

      g.append('line')
        .attr('x1', x(medianA))
        .attr('x2', x(medianA))
        .attr('y1', minY - 5)
        .attr('y2', minY + 5)
        .attr('stroke', '#333');

      g.append('line')
        .attr('x1', x(medianB))
        .attr('x2', x(medianB))
        .attr('y1', minY - 5)
        .attr('y2', minY + 5)
        .attr('stroke', '#333');

      g.append('text')
        .attr('x', midX)
        .attr('y', minY - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#333')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(`Δ: €${d3.format(',')(delta)}`);
    }

    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - 100}, ${margin.top})`);

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', colorA)
      .attr('stroke', '#2c5aa0');

    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '11px')
      .text(filters.country_a || 'Country A');

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 20)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', colorB)
      .attr('stroke', '#c45a1f');

    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 32)
      .style('font-size', '11px')
      .text(filters.country_b || 'Country B');

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Price Distribution Comparison');

    return () => {
      tooltip.remove();
    };
  }, [
    bucketsA,
    bucketsB,
    maxCount,
    medianA,
    medianB,
    delta,
    filters.country_a,
    filters.country_b,
  ]);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data || (bucketsA.length === 0 && bucketsB.length === 0)) {
    return <div className="chart-empty">No distribution data available</div>;
  }

  return (
    <div ref={containerRef} className="chart-container">
      <svg ref={svgRef} />
    </div>
  );
}
