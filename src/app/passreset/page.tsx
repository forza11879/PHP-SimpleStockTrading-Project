import MasterLayout from "@/src/components/MasterLayout";
import PassResetForm from "./PassResetForm";

export const dynamic = "force-dynamic";

export default function PassResetPage() {
  return (
    <MasterLayout title="Password reset">
      <h1>Password reset</h1>
      <PassResetForm />
    </MasterLayout>
  );
}