import * as Sentry from "@sentry/nextjs"
import { scrubSentryEvent, sentryDataCollection } from "@/lib/sentryPrivacy"

Sentry.init({
  dsn: "https://8be833179bc93d7180d15e3d8432c814@o4511936862748672.ingest.de.sentry.io/4511936898334800",
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.05,
  maxBreadcrumbs: 0,
  dataCollection: sentryDataCollection,
  beforeSend: scrubSentryEvent,
})
