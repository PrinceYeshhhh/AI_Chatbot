import express from 'express';
import { exportUserData, deleteUserData, exportAuditLogs, rotateUserEncryptionKey } from '../compliance/complianceController';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// Data export (returns encrypted ZIP)
router.get('/export', auditLogger('export'), async (req, res) => {
  const userId = req.user.id;
  const { zipBuffer, password } = await exportUserData(userId);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="export.zip"');
  // Send password out-of-band (e.g., email, 2FA)
  res.send(zipBuffer);
});

// Right to be Forgotten
router.delete('/delete', auditLogger('delete'), async (req, res) => {
  const userId = req.user.id;
  await deleteUserData(userId);
  res.status(204).send();
});

// Admin: Export audit logs as encrypted CSV
router.get('/audit-logs', auditLogger('export_audit_logs'), async (req, res) => {
  // TODO: Add admin check
  const { csvBuffer, password } = await exportAuditLogs();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv.enc"');
  // Send password out-of-band (e.g., email, 2FA)
  res.send(csvBuffer);
});

// User: Rotate encryption key (on password change)
router.post('/rotate-key', auditLogger('rotate_key'), async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;
  const result = await rotateUserEncryptionKey(userId, oldPassword, newPassword);
  res.json(result);
});

// GDPR: Forget Me endpoint
router.post('/forget-me', async (req, res) => {
  try {
    const userId = req.user.id;
    // Delete user, chat history, files, embeddings (stub embeddings)
    await deleteUserData(userId);
    // TODO: Delete user account from auth provider (stub)
    res.json({ message: 'User data deleted (Right to be Forgotten)' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GDPR: Export Data endpoint
router.get('/export-data', async (req, res) => {
  try {
    const userId = req.user.id;
    const { zipBuffer, password } = await exportUserData(userId);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="export.zip"');
    // Send password out-of-band (e.g., email, 2FA)
    res.send(zipBuffer);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GDPR: Compliance Report endpoint (stub)
router.get('/compliance-report', async (req, res) => {
  // TODO: Generate real compliance report
  res.json({
    status: 'ok',
    report: {
      dataDeletion: 'Compliant',
      dataExport: 'Compliant',
      keyRotation: 'Stubbed',
      lastAudit: new Date().toISOString(),
      notes: 'This is a placeholder compliance report.'
    }
  });
});

export default router; 