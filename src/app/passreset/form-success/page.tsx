import MasterLayout from "@/src/components/MasterLayout";

export default function PassResetFormSuccessPage() {
  return (
    <MasterLayout title="Successful">
      <h1>Password reset successful</h1>
      <a href="/">Click to continue</a>
    </MasterLayout>
  );
}