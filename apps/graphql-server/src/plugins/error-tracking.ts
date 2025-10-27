import type { GraphQLRequestListener } from "@apollo/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";

export const errorTrackingPlugin = {
  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      async didEncounterErrors(requestContext) {
        const activeSpan = trace.getActiveSpan();

        if (requestContext.errors) {
          for (const error of requestContext.errors) {
            activeSpan?.recordException(error);
            activeSpan?.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
          }
        }
      },
    };
  },
};
