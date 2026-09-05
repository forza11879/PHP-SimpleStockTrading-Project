import MasterLayout from "@/src/components/MasterLayout";

export default function LogoutSuccessPage() {
  return (
    <MasterLayout title="Logout successful">
      <div className="mx-auto max-w-sm p-4 text-center lg:p-6">
        <h1 className="text-base font-semibold">Logged out</h1>
        <p className="mt-2 text-sm text-muted">
          You have successfully logged out. You may{" "}
          <a href="/login" className="text-accent">log in</a> or{" "}
          <a href="/register" className="text-accent">register</a>.
        </p>
      </div>
    </MasterLayout>
  );
}
