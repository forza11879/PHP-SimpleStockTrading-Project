import MasterLayout from "@/src/components/MasterLayout";
import PassResetForm from "./PassResetForm";

export const dynamic = "force-dynamic";

export default function PassResetPage() {
  return (
    <MasterLayout title="Password reset">
      <div className="mx-auto max-w-sm p-4 lg:p-6">
        <h1 className="text-base font-semibold">Password reset</h1>
        <div className="mt-4 border border-line bg-surface p-4">
          <PassResetForm />
        </div>
      </div>
    </MasterLayout>
  );
}
