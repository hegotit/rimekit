import { Script, createContext } from 'vm';
import { readFile } from 'fs/promises';
import { cook } from './recipe';

interface Sandbox {
  [key: string]: any;
}

class UserScript {
  protected code: string;
  protected script?: Script;

  constructor(code: string = '') {
    this.code = code;
  }

  async loadFile(filePath: string): Promise<void> {
    this.code = await readFile(filePath, { encoding: 'utf8' });
  }

  compile(): void {
    this.script = new Script(this.code);
  }

  run(sandbox: Sandbox = {}): any {
    if (!this.script) throw new Error('Script not compiled');
    const context = createContext(sandbox);
    return this.script.runInContext(context);
  }
}

export async function runUserScript(filePath: string, ingredients: any): Promise<any> {
  const script = new UserScript();

  await script.loadFile(filePath);

  script.compile();

  const sandbox: Sandbox = {};
  Object.assign(sandbox, global); // Copy global objects into the sandbox
  sandbox.ingredients = ingredients;
  sandbox.cook = (recipe: any, ingredients: any) => {
    sandbox.result = Promise.resolve().then(() => cook(recipe, ingredients));
  };
  script.run(sandbox);
  return sandbox.result;
}
