# Compliance Module

## Features
- GDPR/CCPA endpoints for data download and forget-me requests
- Admin panel for compliance exports and deletion tracking
- Auto-generate downloadable PDFs for GDPR/CCPA reports

## DB Schema
See `compliance_requests` table in migrations.

## Usage
- Use endpoints in `complianceController.ts`
- Extend with logic for data export, deletion, and PDF generation 