import { Analytics } from "@vercel/analytics/react";

import { Home } from "./home";

export default function App() {
  return (
    <>
      <Home />
      <Analytics />
    </>
  );
}
