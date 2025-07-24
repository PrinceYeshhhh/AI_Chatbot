import fs from 'fs';
import path from 'path';
import vm from 'vm';

interface PluginManifest {
  name: string;
  version: string;
  main: string;
  permissions: string[];
}

interface PluginContext {
  log: (...args: any[]) => void;
  // Add more whitelisted APIs here
}

const PLUGIN_DIR = path.resolve(__dirname, '../../../../plugins');

export function loadPlugins(logger = console) {
  if (!fs.existsSync(PLUGIN_DIR)) {
    logger.warn(`[PluginLoader] Plugin directory not found: ${PLUGIN_DIR}`);
    return [];
  }
  const plugins: any[] = [];
  for (const entry of fs.readdirSync(PLUGIN_DIR)) {
    const pluginPath = path.join(PLUGIN_DIR, entry);
    if (!fs.statSync(pluginPath).isDirectory()) continue;
    const manifestPath = path.join(pluginPath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      logger.warn(`[PluginLoader] Missing manifest for plugin: ${entry}`);
      continue;
    }
    let manifest: PluginManifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (e) {
      logger.warn(`[PluginLoader] Invalid manifest for plugin: ${entry}`);
      continue;
    }
    // Versioning: enforce plugin-name@version directory
    if (!entry.startsWith(`${manifest.name}@${manifest.version}`)) {
      logger.warn(`[PluginLoader] Directory name mismatch for plugin: ${entry}`);
      continue;
    }
    // Load and sandbox plugin
    const mainFile = path.join(pluginPath, manifest.main);
    if (!fs.existsSync(mainFile)) {
      logger.warn(`[PluginLoader] Main file not found for plugin: ${entry}`);
      continue;
    }
    try {
      const code = fs.readFileSync(mainFile, 'utf-8');
      const context: PluginContext = {
        log: (...args) => logger.log(`[Plugin:${manifest.name}]`, ...args),
        // Add more APIs as needed, respecting permissions
      };
      const sandbox = { plugin: context, module: {}, exports: {} };
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox, { filename: mainFile });
      plugins.push({ manifest, exports: sandbox.exports });
      logger.log(`[PluginLoader] Loaded plugin: ${manifest.name}@${manifest.version}`);
    } catch (e) {
      logger.warn(`[PluginLoader] Failed to load plugin ${entry}:`, e);
    }
  }
  return plugins;
} 