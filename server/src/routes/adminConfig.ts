import express from 'express';
import { getAdminConfig, updateAdminConfig } from '../services/adminConfigService';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { configureAlerts } from '../utils/alerts';
import { loadPlugins, getPlugins, Plugin } from '../utils/pluginLoader';

const router = express.Router();

// For demo, use a hardcoded workspaceId
const DEMO_WORKSPACE_ID = 'demo-workspace';

router.get('/', async (_req, res) => {
  try {
    const config = await getAdminConfig(DEMO_WORKSPACE_ID);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const config = await updateAdminConfig(DEMO_WORKSPACE_ID, req.body);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to configure alert email, webhook, and SMTP
router.post('/alerts/configure', async (req, res) => {
  try {
    const { email, webhook, smtp } = req.body;
    configureAlerts({ email, webhook, smtp });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to configure alerts' });
  }
});

// Endpoint to list plugins
router.get('/plugins', async (_req, res) => {
  try {
    loadPlugins();
    res.json({ plugins: getPlugins() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list plugins' });
  }
});

const pluginsConfigPath = path.join(__dirname, '../../plugins.json');

// Endpoint to add a plugin
router.post('/plugins', async (req, res) => {
  try {
    const plugin: Plugin = req.body;
    loadPlugins();
    const plugins = getPlugins();
    if (plugins.find(p => p.name === plugin.name)) {
      return res.status(400).json({ error: 'Plugin with this name already exists' });
    }
    plugins.push(plugin);
    fs.writeFileSync(pluginsConfigPath, JSON.stringify(plugins, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to add plugin' });
  }
});

// Endpoint to remove a plugin
router.delete('/plugins/:name', async (req, res) => {
  try {
    const name = req.params.name;
    loadPlugins();
    let plugins = getPlugins();
    plugins = plugins.filter(p => p.name !== name);
    fs.writeFileSync(pluginsConfigPath, JSON.stringify(plugins, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to remove plugin' });
  }
});

// Endpoint to enable a plugin
router.post('/plugins/enable', async (req, res) => {
  try {
    const { name } = req.body;
    loadPlugins();
    const plugins = getPlugins();
    const plugin = plugins.find(p => p.name === name);
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });
    plugin.enabled = true;
    fs.writeFileSync(pluginsConfigPath, JSON.stringify(plugins, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to enable plugin' });
  }
});

// Endpoint to disable a plugin
router.post('/plugins/disable', async (req, res) => {
  try {
    const { name } = req.body;
    loadPlugins();
    const plugins = getPlugins();
    const plugin = plugins.find(p => p.name === name);
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });
    plugin.enabled = false;
    fs.writeFileSync(pluginsConfigPath, JSON.stringify(plugins, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to disable plugin' });
  }
});

// Example: Generate a simple usage report (replace with real data logic)
async function getUsageData() {
  // Replace with real DB queries
  return [
    { user: 'alice', chats: 42, files: 5, tokens: 12345 },
    { user: 'bob', chats: 17, files: 2, tokens: 6789 },
  ];
}

router.get('/report/pdf', async (_req, res) => {
  try {
    const data = await getUsageData();
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, '../../tmp', `report_${Date.now()}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(18).text('Usage Report', { align: 'center' });
    doc.moveDown();
    data.forEach(row => {
      doc.fontSize(12).text(`User: ${row.user}, Chats: ${row.chats}, Files: ${row.files}, Tokens: ${row.tokens}`);
    });
    doc.end();
    doc.on('finish', () => {
      res.download(filePath, 'usage_report.pdf', () => {
        fs.unlinkSync(filePath);
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/report/csv', async (_req, res) => {
  try {
    const data = await getUsageData();
    const filePath = path.join(__dirname, '../../tmp', `report_${Date.now()}.csv`);
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'user', title: 'User' },
        { id: 'chats', title: 'Chats' },
        { id: 'files', title: 'Files' },
        { id: 'tokens', title: 'Tokens' },
      ],
    });
    await csvWriter.writeRecords(data);
    res.download(filePath, 'usage_report.csv', () => {
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 