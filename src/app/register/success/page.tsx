import MasterLayout from "@/src/components/MasterLayout";

export default function RegisterSuccessPage() {
  return (
    <MasterLayout>
      <div className="mx-auto max-w-sm p-4 text-center lg:p-6">
        <h1 className="text-base font-semibold">Registration successful</h1>
        <p className="mt-2 text-sm text-muted">
          You may now <a href="/login" className="text-accent">log in</a>.
        </p>
      </div>
    </MasterLayout>
  );
}
