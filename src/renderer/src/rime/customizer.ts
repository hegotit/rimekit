import { Config } from './config';

export class Customizer extends Config {
  patch: { [key: string]: any } = {};

  constructor(yaml?: string) {
    super(yaml);
    this.root = this.root ?? {};
  }

  addPatch(key: string, value: any) {
    this.patch[key] = value;
  }

  applyPatch(config: Config) {
    for (const key in this.patch) {
      config.set(key, this.patch[key]);
    }
  }
}

// Usage

const yaml = `
foo:
  bar: baz
`;

const config = new Config(yaml);

const customizer = new Customizer();
customizer.addPatch('foo.bar', 'qux');
customizer.applyPatch(config);

console.log(config.get('foo.bar')); // qux
