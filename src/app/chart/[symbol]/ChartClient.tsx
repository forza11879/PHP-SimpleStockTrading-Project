"use client";

import { useEffect, useRef } from "react";
import Highcharts from "highcharts/highstock";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function applyTheme(): void {
  Highcharts.setOptions({
  chart: {
    backgroundColor: "#ffffff",
    style: { fontFamily: FONT_STACK },
  },
  title: {
    style: { color: "#1a2332", fontSize: "14px", fontWeight: "600" },
  },
  xAxis: {
    crosshair: true,
    gridLineColor: "#e2e8f0",
    labels: { style: { color: "#5b6b7f", fontSize: "11px" } },
  },
  yAxis: {
    gridLineColor: "#e2e8f0",
    labels: {
      style: { color: "#5b6b7f", fontSize: "11px" },
      format: "${value:.2f}",
    },
  },
  tooltip: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    style: { color: "#1a2332", fontSize: "12px" },
    valueDecimals: 2,
    xDateFormat: "%Y-%m-%d",
  },
  plotOptions: {
    candlestick: {
      upColor: "#16a34a",
      upLineColor: "#16a34a",
      color: "#dc2626",
      lineColor: "#dc2626",
    },
  },
  credits: { enabled: false },
  });
}

export default function ChartClient({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: Highcharts.Chart | undefined;
    applyTheme();

    fetch(`/fetch/${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((data: Array<[number, number, number, number, number]>) => {
        if (!containerRef.current) return;
        chart = Highcharts.stockChart(containerRef.current, {
          rangeSelector: {
            selected: 1,
          },
          title: {
            text: symbol,
          },
          series: [
            {
              type: "candlestick",
              name: "Price",
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
    <div ref={containerRef} style={{ height: 580, minWidth: 310 }} />
  );
}
