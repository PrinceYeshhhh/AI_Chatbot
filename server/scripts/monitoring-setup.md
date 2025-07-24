# Real-Time Monitoring Setup (Grafana + Prometheus)

## 1. Prometheus Setup
- Install Prometheus: https://prometheus.io/download/
- Add a scrape job for your Node.js backend (use a metrics endpoint, e.g., /metrics)

Example prometheus.yml:
```yaml
scrape_configs:
  - job_name: 'node-backend'
    static_configs:
      - targets: ['localhost:3001']
```
- Start Prometheus: `./prometheus --config.file=prometheus.yml`

## 2. Expose Metrics in Node.js
- Use a library like `prom-client`:
  ```sh
  npm install prom-client
  ```
- In your backend, add:
  ```js
  import client from 'prom-client';
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics();
  app.get('/metrics', (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(client.register.metrics());
  });
  ```
- This exposes RAM, CPU, and custom metrics at `/metrics`.

## 3. Grafana Setup
- Install Grafana: https://grafana.com/grafana/download
- Add Prometheus as a data source.
- Import a Node.js dashboard (search Grafana dashboards for "Node.js" or "Prometheus")
- Create panels for:
  - RAM/CPU usage
  - Request/response times
  - Error rates
  - Custom metrics (e.g., active users, file uploads)

## 4. Supabase Monitoring
- Use Supabase dashboard for DB metrics.
- Optionally, use Postgres exporter for Prometheus: https://github.com/prometheus-community/postgres_exporter
- Add a scrape job for Postgres exporter in prometheus.yml

## 5. Alerts
- Set up Grafana alerts for high RAM/CPU, slow response, or error spikes.

---

**With this setup, you get real-time dashboards and alerts for your AI SaaS platform!** 