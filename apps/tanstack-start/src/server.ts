// eslint-disable-next-line no-console
import "./otel";

import handler from "@tanstack/react-start/server-entry";

export default {
  fetch(request: Request) {
    return handler.fetch(request);
  },
};
