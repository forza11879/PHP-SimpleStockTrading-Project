import MasterLayout from "@/src/components/MasterLayout";

export default function LogoutSuccessPage() {
  return (
    <MasterLayout title="Logout successful">
      <p>You have successfully logged out !!!</p>
      <p>
        You may <a href="/login">login</a> or <a href="/register">register</a>.
      </p>
    </MasterLayout>
  );
}