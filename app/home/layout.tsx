import "@/app/styles/globals.scss";
import "@/app/styles/markdown.scss";
import "@/app/styles/highlight.scss";
import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
