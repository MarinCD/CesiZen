import type { ErrorEvent } from "@sentry/nextjs"

type DataCollection = NonNullable<
  Parameters<typeof import("@sentry/nextjs").init>[0]["dataCollection"]
>

/**
 * CESIZen traite des données liées à la santé mentale. Sentry ne doit recevoir
 * que le contexte technique nécessaire au diagnostic d'une erreur.
 */
export const sentryDataCollection: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: false,
    response: false,
  },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: {
    document: false,
    variables: false,
  },
  genAI: {
    inputs: false,
    outputs: false,
  },
  databaseQueryData: false,
  stackFrameVariables: false,
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  delete event.user
  delete event.extra

  if (event.request) {
    delete event.request.cookies
    delete event.request.data
    delete event.request.headers
    delete event.request.query_string
  }

  return event
}
