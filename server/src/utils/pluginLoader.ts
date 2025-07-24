import fs from 'fs';
import path from 'path';

export interface Plugin {
  name: string;
  description: string;
  inputs: any;
  outputs: any;
  handlerPath: string;
  enabled: boolean;
}

let plugins: Plugin[] = [];

export function loadPlugins() {
  const configPath = path.join(__dirname, '../../plugins.json');
  if (!fs.existsSync(configPath)) return;
  const raw = fs.readFileSync(configPath, 'utf-8');
  plugins = JSON.parse(raw);
}

export function getPlugins(): Plugin[] {
  return plugins;
}

export function getEnabledPlugins(): Plugin[] {
  return plugins.filter(p => p.enabled);
} 