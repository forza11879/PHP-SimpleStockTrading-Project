import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="bg-canvas font-sans text-sm text-ink">
      <div className="mx-auto mt-16 max-w-sm border border-line bg-surface p-6">
        <h1 className="text-base font-semibold">Log In</h1>
        <div className="mt-4">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
