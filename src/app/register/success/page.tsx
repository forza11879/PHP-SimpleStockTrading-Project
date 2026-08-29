import MasterLayout from "@/src/components/MasterLayout";

export default function RegisterSuccessPage() {
  return (
    <MasterLayout>
      <p>
        Registration successful. You may now <a href="/login">login</a>.
      </p>
    </MasterLayout>
  );
}