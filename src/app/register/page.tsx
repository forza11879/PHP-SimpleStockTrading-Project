import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <div className="row centered-form">
      <div className="col-xs-12 col-sm-8 col-md-4 col-sm-offset-2 col-md-offset-4">
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title">Register</h3>
          </div>
          <div className="panel-body">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}