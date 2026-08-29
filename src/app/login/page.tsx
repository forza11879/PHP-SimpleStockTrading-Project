import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="row centered-form">
      <div className="col-xs-12 col-sm-8 col-md-4 col-sm-offset-2 col-md-offset-4">
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title">Login</h3>
          </div>
          <div className="panel-body">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}