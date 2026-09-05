import MasterLayout from "@/src/components/MasterLayout";

export default function PassResetSuccessPage() {
  return (
    <MasterLayout title="Password reset">
      <div className="mx-auto max-w-sm p-4 text-center lg:p-6">
        <h1 className="text-base font-semibold">Reset email sent</h1>
        <p className="mt-2 text-sm text-muted">
          An email with a password reset link is on its way. Please allow a
          few minutes for it to arrive.{" "}
          <a href="/" className="text-accent">Click here to continue</a>.
        </p>
      </div>
    </MasterLayout>
  );
}
