import MasterLayout from "@/src/components/MasterLayout";

export default function PassResetFormSuccessPage() {
  return (
    <MasterLayout title="Successful">
      <div className="mx-auto max-w-sm p-4 text-center lg:p-6">
        <h1 className="text-base font-semibold">Password reset successful</h1>
        <p className="mt-2 text-sm text-muted">
          <a href="/login" className="text-accent">Log in</a> with your new
          password to continue.
        </p>
      </div>
    </MasterLayout>
  );
}
