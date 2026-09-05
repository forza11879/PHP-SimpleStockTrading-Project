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
      <div className="p-4 lg:p-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">{symbol} — 1Y Daily</h2>
        </div>
        <div className="border border-line bg-surface p-2">
          <ChartClient symbol={symbol} />
        </div>
      </div>
    </MasterLayout>
  );
}
