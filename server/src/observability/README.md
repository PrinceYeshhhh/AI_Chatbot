# Observability & Monitoring

## Sentry (Error Monitoring)
- Backend: Enable by setting `SENTRY_DSN` env var and uncommenting Sentry code in `observability.ts`.
- Frontend: Use Sentry browser SDK.

## Prometheus (Metrics)
- Backend: Uncomment Prometheus code in `observability.ts`.
- Expose `/metrics` endpoint for scraping.

## Datadog/LogRocket (Frontend Tracing)
- Integrate in frontend codebase (see Datadog/LogRocket docs).

## Metrics to Track
- LLM response latency
- File chunking failures
- API success/failure ratio
- Memory vector size growth per user

## Alerts
- System crashes
- Usage anomalies
- Error rate > X% 