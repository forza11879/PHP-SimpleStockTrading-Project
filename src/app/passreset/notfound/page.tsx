import MasterLayout from "@/src/components/MasterLayout";

export default function PassResetNotFoundPage() {
  return (
    <MasterLayout title="Failed reset">
      <h1>Failed reset</h1>
      <p>Password reset token does not exist or has expired.</p>
      <p>
        You may <a href="/passreset">request a new token</a>.
      </p>
      <a href="/">Click to continue</a>
    </MasterLayout>
  );
}