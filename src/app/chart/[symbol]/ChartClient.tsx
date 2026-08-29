"use client";

import { useEffect, useRef } from "react";
import Highcharts from "highcharts/highstock";

export default function ChartClient({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: Highcharts.Chart | undefined;

    fetch(`/fetch/${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((data: Array<[number, number, number, number, number]>) => {
        if (!containerRef.current) return;
        chart = Highcharts.stockChart(containerRef.current, {
          rangeSelector: {
            selected: 1,
          },
          title: {
            text: `<strong>${symbol}</strong>`,
          },
          series: [
            {
              type: "candlestick",
              name: "Stock Price",
              data,
              dataGrouping: {
                units: [
                  ["week", [1]],
                  ["month", [1, 2, 3, 4, 6]],
                ],
              },
            },
          ],
        });
      });

    return () => {
      if (chart) chart.destroy();
    };
  }, [symbol]);

  return (
    <div id="container" ref={containerRef} style={{ height: 580, minWidth: 310 }} />
  );
}