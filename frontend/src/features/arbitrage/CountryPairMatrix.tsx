import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedArbitrageFilters } from './ArbitrageFilterContext';
import { fetchCountryPairMatrix, type CountryPairResult } from './api';
import { arbitrageKeys } from './queryKeys';

function SkeletonLoader() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-row" />
      <div className="skeleton-row" />
      <div className="skeleton-row" />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="chart-error">Error: {message}</div>;
}

export function CountryPairMatrix() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const filters = useDebouncedArbitrageFilters();

  const queryKey = useMemo(
    () => arbitrageKeys.countryPairMatrix(filters),
    [filters],
  );

  const { data, isLoading, error } = useQuery<CountryPairResult[]>({
    queryKey,
    queryFn: () => fetchCountryPairMatrix(filters),
  });

  const { countries, matrix, maxDelta } = useMemo(() => {
    if (!data || data.length === 0) {
      return { countries: [] as string[], matrix: new Map(), maxDelta: 0 };
    }

    const countrySet = new Set<string>();
    data.forEach((d) => {
      countrySet.add(d.buy_country);
      countrySet.add(d.sell_country);
    });
    const countryList = Array.from(countrySet).sort();

    const matrixMap = new Map<string, CountryPairResult>();
    let max = 0;
    data.forEach((d) => {
      const key = `${d.buy_country}-${d.sell_country}`;
      matrixMap.set(key, d);
      if (Math.abs(d.avg_price_delta) > max) {
        max = Math.abs(d.avg_price_delta);
      }
    });

    return { countries: countryList, matrix: matrixMap, maxDelta: max };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || countries.length === 0)
      return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(400, countries.length * 40 + 60);
    const margin = { top: 60, right: 30, bottom: 30, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(countries)
      .range([0, innerWidth])
      .padding(0.05);
    const y = d3
      .scaleBand()
      .domain(countries)
      .range([0, innerHeight])
      .padding(0.05);

    const colorScale = d3
      .scaleSequential()
      .domain([0, maxDelta || 1])
      .interpolator(d3.interpolateGreens);

    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'heatmap-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('z-index', '10');

    g.selectAll('.cell')
      .data(
        countries.flatMap((buy) => countries.map((sell) => ({ buy, sell }))),
      )
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d) => x(d.sell) || 0)
      .attr('y', (d) => y(d.buy) || 0)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', (d) => {
        if (d.buy === d.sell) return '#f0f0f0';
        const key = `${d.buy}-${d.sell}`;
        const cellData = matrix.get(key);
        if (!cellData) return '#fff';
        if (cellData.sample_size < 10) return '#ccc';
        return colorScale(cellData.avg_price_delta);
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', (d) => {
        const key = `${d.buy}-${d.sell}`;
        const cellData = matrix.get(key);
        return cellData && cellData.sample_size >= 10 ? 'pointer' : 'default';
      })
      .on('mouseover', function (event, d) {
        const key = `${d.buy}-${d.sell}`;
        const cellData = matrix.get(key);
        if (!cellData) return;

        d3.select(this).attr('stroke', '#333').attr('stroke-width', 2);

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(
            `<strong>${d.buy} → ${d.sell}</strong><br/>
            Delta: €${cellData.avg_price_delta.toLocaleString()}<br/>
            Sample: ${cellData.sample_size}<br/>`,
          )
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`);

        if (cellData.sample_size < 10) {
          tooltip.html(
            tooltip.html() +
              '<br/><span style="color: orange;">⚠️ Small sample size</span>',
          );
        }
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1);
        tooltip.transition().duration(200).style('opacity', 0);
      });

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '11px');

    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '11px');

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Country Pair Price Delta Matrix');

    return () => {
      tooltip.remove();
    };
  }, [countries, matrix, maxDelta]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (svgRef.current && data) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [data]);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data || data.length === 0)
    return <div className="chart-empty">No data available</div>;

  return (
    <div ref={containerRef} className="chart-container">
      <svg ref={svgRef} />
    </div>
  );
}
