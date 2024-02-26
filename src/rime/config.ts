import * as fs from 'fs/promises';
import { parse, stringify } from 'yaml';

export class Config {
  protected root: any;

  constructor(yaml?: string) {
    this.root = yaml ? parse(yaml) : null;
  }

  async loadFromFile(filePath: string) {
    const content = await fs.readFile(filePath, 'utf8');
    // remove potential BOM character
    const yaml = content.replace(/^\ufeff/, '');
    this.root = parse(yaml);
    return this;
  }

  async saveToFile(file: string) {
    await fs.writeFile(file, stringify(this.root));
  }

  get(key: string) {
    return key.split('/').reduce((prev, curr) => prev?.[curr], this.root);
  }

  set(key: string, value: any) {
    const keys = key.split('/');
    const lastKey = keys.pop() as string;
    keys.reduce((prev, curr) => (prev[curr] = prev[curr] || {}), this.root)[lastKey] = value;
  }
}
