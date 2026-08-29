import MasterLayout from "@/src/components/MasterLayout";
import PassResetForm from "../PassResetForm";

export const dynamic = "force-dynamic";

export default async function PassResetTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <MasterLayout title="Password reset">
      <h1>Password reset</h1>
      <PassResetForm token={token} />
    </MasterLayout>
  );
}