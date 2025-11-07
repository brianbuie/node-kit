import * as fs from 'node:fs';
import { merge } from 'lodash-es';
import * as qt from 'quicktype-core';

export class TypeWriter {
  moduleName;
  input = qt.jsonInputForTargetLanguage('typescript');
  outDir;
  qtSettings;

  constructor(moduleName: string, settings: { outDir?: string } & Partial<qt.Options> = {}) {
    this.moduleName = moduleName;
    const { outDir, ...qtSettings } = settings;
    this.outDir = outDir || './types';
    const defaultSettings = {
      lang: 'typescript',
      rendererOptions: {
        'just-types': true,
        'prefer-types': true,
      },
      inferEnums: false,
      inferDateTimes: false,
    };
    this.qtSettings = merge(defaultSettings, qtSettings);
  }

  async addMember(name: string, _samples: any[]) {
    const samples = _samples.map((s) => (typeof s === 'string' ? s : JSON.stringify(s)));
    await this.input.addSource({ name, samples });
  }

  async toString() {
    const inputData = new qt.InputData();
    inputData.addInput(this.input);
    const result = await qt.quicktype({
      inputData,
      ...this.qtSettings,
    });
    return result.lines.join('\n');
  }

  async toFile() {
    const result = await this.toString();
    fs.mkdirSync(this.outDir, { recursive: true });
    fs.writeFileSync(`${this.outDir}/${this.moduleName}.d.ts`, result);
  }
}
