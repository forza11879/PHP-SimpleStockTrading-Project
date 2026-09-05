import MasterLayout from "@/src/components/MasterLayout";

export default function PassResetNotFoundPage() {
  return (
    <MasterLayout title="Failed reset">
      <div className="mx-auto max-w-sm p-4 text-center lg:p-6">
        <h1 className="text-base font-semibold">Reset link invalid</h1>
        <p className="mt-2 text-sm text-muted">
          This password reset link does not exist or has expired. You may{" "}
          <a href="/passreset" className="text-accent">request a new one</a>.
        </p>
      </div>
    </MasterLayout>
  );
}
