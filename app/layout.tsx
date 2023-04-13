/* eslint-disable @next/next/no-page-custom-font */
import process from "child_process";
import { ACCESS_CODES, IS_IN_DOCKER } from "./api/access";

let COMMIT_ID: string | undefined;
try {
  COMMIT_ID = process
    // .execSync("git describe --tags --abbrev=0")
    .execSync("git rev-parse --short HEAD")
    .toString()
    .trim();
} catch (e) {
  console.error("No git or not from git repo.");
}

export const metadata = {
  title: "AI Chat",
  description: "An AI assistant build by Realshark via ChatGPT.",
  appleWebApp: {
    title: "AI Chat",
    statusBarStyle: "black-translucent",
  },
  themeColor: "#fafafa",
};

function Meta() {
  const metas = {
    version: COMMIT_ID ?? "unknown",
    access: ACCESS_CODES.size > 0 || IS_IN_DOCKER ? "enabled" : "disabled",
  };

  return (
    <>
      {Object.entries(metas).map(([k, v]) => (
        <meta name={k} content={v} key={k} />
      ))}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
        />
        <meta
          name="theme-color"
          content="#151515"
          media="(prefers-color-scheme: dark)"
        />
        <Meta />
        <link rel="manifest" href="/site.webmanifest"></link>
        <script src="/serviceWorkerRegister.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
