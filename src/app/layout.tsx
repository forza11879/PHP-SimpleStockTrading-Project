import "./globals.css";

export const metadata = {
  title: "Trading Simulator",
  description: "A simple stock trading simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
        <link href="/bootstrap/css/sb-admin.css" rel="stylesheet" />
        <link href="/bootstrap/css/plugins/morris.css" rel="stylesheet" />
        <link
          href="/bootstrap/font-awesome/css/font-awesome.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <link href="/css/full.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}