import MasterLayout from "@/src/components/MasterLayout";

export default function ContactPage() {
  return (
    <MasterLayout title="Contact">
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="glyphicon glyphicon-bookmark"></i> Contact
        </h3>
      </div>
      <div className="panel-body">
        <p>
          Questions or feedback about the Trading Simulator? We&apos;d love to
          hear from you.
        </p>
        <p>
          Email us at{" "}
          <a href="mailto:forza11879@gmail.com">forza11879@gmail.com</a>.
        </p>
      </div>
    </MasterLayout>
  );
}