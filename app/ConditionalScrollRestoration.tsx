import { ScrollRestoration, useLocation } from "@remix-run/react";

function ConditionalScrollRestoration() {
  const location = useLocation();
  if (
    location.state != null &&
    typeof location.state === "object" &&
    (location.state as { scroll: boolean }).scroll === false
  ) {
    return null;
  }
  return <ScrollRestoration />;
}

export default ConditionalScrollRestoration