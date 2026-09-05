import MasterLayout from "@/src/components/MasterLayout";

export default function ContactPage() {
  return (
    <MasterLayout title="Contact">
      <div className="mx-auto max-w-sm p-4 lg:p-6">
        <h1 className="text-base font-semibold">Contact</h1>
        <div className="mt-4 border border-line bg-surface p-4 text-sm">
          <p>
            Questions or feedback about the Trading Simulator? We&apos;d love
            to hear from you.
          </p>
          <p className="mt-2">
            Email us at{" "}
            <a href="mailto:forza11879@gmail.com" className="text-accent">
              forza11879@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </MasterLayout>
  );
}
