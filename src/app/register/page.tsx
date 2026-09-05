import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <div className="bg-canvas font-sans text-sm text-ink">
      <div className="mx-auto mt-16 max-w-sm border border-line bg-surface p-6">
        <h1 className="text-base font-semibold">Register</h1>
        <div className="mt-4">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
