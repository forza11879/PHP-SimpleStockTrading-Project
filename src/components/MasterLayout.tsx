import type { ReactNode } from "react";
import { getSessionUser, type SessionUser } from "@/src/lib/session";
import { refreshEquity } from "@/src/lib/trading";
import { formatPrice } from "@/src/lib/money";
import { queryFirstRow } from "@/src/lib/db";

interface MasterLayoutProps {
  title?: string;
  user?: SessionUser | null;
  pageHeader?: ReactNode;
  children: ReactNode;
}

export default async function MasterLayout({
  title = "Trading Simulator",
  user,
  pageHeader,
  children,
}: MasterLayoutProps) {
  const sessionUser = (await getSessionUser()) ?? user ?? null;
  // Read the account fresh so the shell never shows a stale login-time
  // snapshot alongside freshly computed values on the pages.
  const account = sessionUser
    ? queryFirstRow(
        "SELECT cash, equity FROM users WHERE id = ?",
        sessionUser.id,
      )
    : null;
  if (sessionUser && account) refreshEquity(sessionUser.id);
  const cash = account ? Number(account.cash ?? 0) : 0;
  const equity = account ? Number(account.equity ?? 0) : 0;

  return (
    <div>
      <div id="wrapper">
        <nav className="navbar navbar-inverse navbar-fixed-top" role="navigation">
          <div className="navbar-header">
            <button
              type="button"
              className="navbar-toggle"
              data-toggle="collapse"
              data-target=".navbar-ex1-collapse"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <a className="navbar-brand" href="/">
              <strong>Trading Simulator</strong>
            </a>
          </div>
          <ul className="nav navbar-right top-nav">
            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown">
                <i className="fa fa-user"></i>
                {sessionUser ? ` Welcome ${sessionUser.name}!` : ""}
                <b className="caret"></b>
              </a>
              <ul className="dropdown-menu">
                <li>
                  <a href="/login">
                    <i className="fa fa-fw fa-user"></i> Log-in
                  </a>
                </li>
                <li className="divider"></li>
                <li>
                  {sessionUser ? (
                    <a href="/logout">
                      <i className="fa fa-fw fa-power-off"></i> Log Out
                    </a>
                  ) : null}
                </li>
              </ul>
            </li>
          </ul>
          <div className="collapse navbar-collapse navbar-ex1-collapse">
            <ul className="nav navbar-nav side-nav">
              <li className="active">
                <a href="/dashboard">
                  <i className="fa-fw glyphicon glyphicon-folder-open"></i> Dashboard
                </a>
              </li>
              <li>
                <a href="/portfolio">
                  <i className="fa fa-fw fa-briefcase"></i> Portfolio
                </a>
              </li>
              <li>
                <a href="/list">
                  <i className="fa fa-fw fa-binoculars"></i> Watch List
                </a>
              </li>
              <li>
                <a href="/orders">
                  <i className="fa fa-fw fa-table"></i> Orders
                </a>
              </li>
              <li>
                <h3 style={{ color: "grey", paddingLeft: 15 }}>
                  <strong>Cash:</strong> ${formatPrice(cash)}
                </h3>
                <h3 style={{ color: "grey", paddingLeft: 15 }}>
                  <strong>Equity:</strong> ${formatPrice(equity)}
                </h3>
                <h3 style={{ color: "grey", paddingLeft: 15 }}>
                  <strong>Gain/Loss:</strong> ${formatPrice(equity - 50000)}
                </h3>
              </li>
            </ul>
          </div>
        </nav>
        <div id="page-wrapper">
          <div className="container-fluid">
            {pageHeader ?? (
              <div className="row">
                <div className="col-lg-12">
                  <ol className="breadcrumb">
                    <li className="active">
                      <i className="fa fa-dashboard"></i> Trading Simulator
                    </li>
                  </ol>
                </div>
              </div>
            )}
            <div className="row">
              <div className="col-lg-12">
                <div className="panel panel-default">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <script src="/bootstrap/js/jquery.js"></script>
      <script src="/bootstrap/js/bootstrap.min.js"></script>
      <script src="/bootstrap/js/plugins/morris/raphael.min.js"></script>
      <script src="/bootstrap/js/plugins/morris/morris.min.js"></script>
      <script src="/bootstrap/js/plugins/morris/morris-data.js"></script>
    </div>
  );
}