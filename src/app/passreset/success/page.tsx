import MasterLayout from "@/src/components/MasterLayout";

export default function PassResetSuccessPage() {
  return (
    <MasterLayout title="Password reset">
      <h1>Password reset - email sent</h1>
      <p>
        Email with password reset code has been sent. Please allow the email a
        few minutes to arrive. <a href="/">Click here to continue</a>
      </p>
    </MasterLayout>
  );
}