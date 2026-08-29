import MasterLayout from "@/src/components/MasterLayout";
import ChartClient from "./ChartClient";

export const dynamic = "force-dynamic";

export default async function ChartPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  return (
    <MasterLayout title={`Chart - ${symbol}`}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="fa fa-bar-chart-o fa-fw"></i> Charts
        </h3>
      </div>
      <div className="panel-body">
        <ChartClient symbol={symbol} />
      </div>
    </MasterLayout>
  );
}