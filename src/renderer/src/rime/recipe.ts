import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { Config } from './config';
import * as path from 'path';
import { Customizer } from './customizer';

interface RecipeSummary {
  name: string;
  version: string;
  params?: { [key: string]: any };
}

interface Props {
  name: string;
  version: string;
  files?: { url: string }[];
  sha1sum?: { [file: string]: string };
  paramNames4Check?: { name: string; required?: boolean }[];
  setup?: () => void;
  rimeUserDir?: string;
  rimeSharedDir?: string;
}

export class RecipeList {
  fileName: string;
  loaded: boolean;
  loading: boolean;
  list: RecipeSummary[];
  pending: (() => void)[];
  autoSave: boolean;

  constructor(fileName = 'recipes.yaml') {
    this.fileName = fileName;
    this.loaded = false;
    this.loading = false;
    this.list = [];
    this.pending = [];
    this.autoSave = true;
  }

  async schedule(work: () => void) {
    this.pending.push(work);
    if (this.loading) {
      return;
    }
    if (!this.loaded) {
      await this.load();
    }
    await this.doPendingWork();
  }

  doPendingWork = async () => {
    while (this.pending.length != 0) {
      const work = this.pending.shift();
      if (work) {
        work();
      }
    }
    if (this.autoSave) {
      await this.save();
    }
  };

  async load() {
    const filePath = `${Recipe.rimeUserDir}/${this.fileName}`;
    const config = new Config();
    try {
      this.loading = true;
      await config.loadFromFile(filePath);
      this.loading = false;
      this.loaded = true;
      this.list = config.get('recipes') ?? [];
    } catch (e) {
      this.loading = false;
      throw e;
    }
  }

  async save() {
    const filePath = `${Recipe.rimeUserDir}/${this.fileName}`;
    const config = new Config();
    config.set('recipes', this.list);
    await config.saveToFile(filePath);
  }

  async clear() {
    await this.schedule(() => {
      this.list = [];
    });
  }

  async add(recipe: Recipe) {
    await this.schedule(() => {
      const summary = {
        name: recipe.props.name,
        version: recipe.props.version,
        params: recipe.params,
      };
      this.list.push(summary);
    });
  }
}

export const recipes = new RecipeList();

export const cook = (recipe: Recipe | any, ingredients?: any) => {
  try {
    if (!(recipe instanceof Recipe)) {
      recipe = new Recipe(recipe);
    }
    if (recipe.props.params) {
      recipe.collectParams(ingredients ?? {});
    }
  } catch (e) {
    console.error(`error parsing recipe: ${e}`);
    throw e;
  }

  return recipe
    .downloadFiles()
    .then(() => {
      if (recipe.props.setup) {
        recipe.props.setup.call(recipe);
      }
    })
    .then(async () => {
      await recipes.add(recipe);
    })
    .catch((e: Error) => {
      console.error(`error cooking recipe: ${e}`);
      throw e;
    });
};

export class Recipe {
  static rimeUserDir = '.';
  static rimeSharedDir = '.';

  downloadDirectory?: string;

  props: Props;

  params?: { [key: string]: any };

  constructor(props: Props) {
    this.props = props;
    this.validate();
  }

  validate() {
    // name and version are required
    if (!this.props.name) {
      throw new Error('missing recipe name.');
    }

    if (!this.props.version) {
      throw new Error('missing recipe version.');
    }

    if (!/^[_0-9A-Za-z]+$/.test(this.props.name)) {
      throw new Error('recipe name should be alpha_numeric.');
    }

    // if (typeof this.props.version !== "string") {
    //     throw new Error("recipe version should be string type.");
    // }

    if (this.props.rimeUserDir) {
      Recipe.rimeUserDir = this.props.rimeUserDir;
    }
    try {
      fsSync.accessSync(Recipe.rimeUserDir);
    } catch (e) {
      throw new Error('Rime user directory not accessible.');
    }

    if (this.props.rimeSharedDir) {
      Recipe.rimeSharedDir = this.props.rimeSharedDir;
    }
  }

  collectParams(ingredients: { [key: string]: any }) {
    if (!this.params) {
      this.params = {};
    }
    if (!this.props.paramNames4Check) {
      return;
    }
    for (const param of this.props.paramNames4Check) {
      if (!param || typeof param !== 'object') {
        throw new Error('invalid parameter definition.');
      }
      const name = param.name;
      if (param.required && !ingredients[name]) {
        throw new Error(`missing ingredient: ${name}`);
      }
      this.params[name] = ingredients[name];
    }
  }

  async downloadFiles() {
    // Check if there are files to download
    if (!this.props.files) {
      return;
    }

    // Create download folder if needed
    const downloadDir = `${Recipe.rimeUserDir}/download`;

    try {
      await fs.access(downloadDir);
    } catch (e) {
      await fs.mkdir(downloadDir);
    }

    // Create recipe folder under download folder
    this.downloadDirectory = `${downloadDir}/${this.props.name}`;

    try {
      await fs.access(this.downloadDirectory);
    } catch (e) {
      await fs.mkdir(this.downloadDirectory);
    }

    // Download each file
    await Promise.all(this.props.files.map(async (file) => this.downloadFile(file)));
  }

  async downloadFile(file: { url: string }) {
    const fileName = path.posix.basename(file.url);
    const dest = `${this.downloadDirectory}/${fileName}`;

    try {
      await fs.access(dest);
      // Check if already exists
      if (this.props.sha1sum?.[fileName]) {
        await this.checksum(fileName, dest);
      }
    } catch (e) {
      console.log(`downloading ${fileName}`);

      try {
        const fileData = await fs.readFile(file.url);
        await fs.writeFile(dest, fileData);
      } catch (e: Error | any) {
        console.log(`failed to download ${fileName}: ${e?.message}`);
        throw e;
      }

      console.log(`${fileName} downloaded to ${this.downloadDirectory}`);

      if (this.props.sha1sum?.[fileName]) {
        await this.checksum(fileName, dest);
      }
    }
  }

  async checksum(fileName: string, filePath: string) {
    const expected = this.props.sha1sum?.[fileName];

    if (!expected) {
      throw new Error(`Checksum missing for expected ${fileName}`);
    }

    const hash = crypto.createHash('sha1');
    const fileData = await fs.readFile(filePath);
    hash.update(fileData);
    const actual = hash.digest('hex');

    if (actual !== expected) {
      throw new Error(`Checksum mismatch for ${fileName}: expected ${expected}, got ${actual}`);
    }
  }

  async copyFile(src: string) {
    const fileName = path.posix.basename(src);
    const dest = `${Recipe.rimeUserDir}/${fileName}`;

    try {
      await fs.copyFile(src, dest);
    } catch (e: Error | any) {
      console.log(`error copying file: ${e?.message}`);
      throw e;
    }

    console.log(`${fileName} copied to ${Recipe.rimeUserDir}`);
  }

  async installSchema(schemaId: string) {
    if (!this.downloadDirectory) {
      throw new Error(`No files to install for schema ${schemaId}`);
    }

    const schemaFile = `${this.downloadDirectory}/${schemaId}.schema.yaml`;
    const config = new Config();
    await config.loadFromFile(schemaFile);
    const dictId = config.get('translator/dictionary');
    if (dictId) {
      const dictFile = `${this.downloadDirectory}/${dictId}.dict.yaml`;
      try {
        await fs.access(dictFile);
        await this.copyFile(dictFile);
      } catch (e) {
        console.log('Error loading dictionary');
        throw e;
      }
    }

    // await Promise.all([this.copyFile(dictFile)]);
  }

  async findConfigFile(fileName: string): Promise<string | undefined> {
    const userFile = `${Recipe.rimeUserDir}/${fileName}`;

    const config = new Config();
    try {
      await config.loadFromFile(userFile);
      if (typeof config.get('customization') !== 'number') {
        return userFile;
      }
    } catch (e) {
      if (Recipe.rimeUserDir !== Recipe.rimeSharedDir) {
        const filePath = `${Recipe.rimeSharedDir}/${fileName}`;
        try {
          await fs.access(filePath);
          return filePath;
        } catch (e) {
          console.log('Error loading findConfigFile');
          throw e;
        }
      } else {
        return undefined;
      }
    }
  }

  async getDefaultSchemaList() {
    const configFile = await this.findConfigFile('default.yaml');

    if (!configFile) {
      return [];
    }

    const config = new Config();
    try {
      await config.loadFromFile(configFile);
      return config.get('schema_list') ?? [];
    } catch (e) {
      console.error('');
      return [];
    }
  }

  async editSchemaList(edit: (list: string[]) => void) {
    await this.customize('default', async (c) => {
      const schemaList = c.patch['schema_list'] ?? (await this.getDefaultSchemaList());

      edit(schemaList);
      c.addPatch('schema_list', schemaList);
    });
  }

  async enableSchema(schemaId: string) {
    await this.editSchemaList((list) => {
      if (!list.includes(schemaId)) {
        list.push(schemaId);
      }
    });
  }

  async disableSchema(schemaId: string) {
    await this.editSchemaList((list) => {
      const index = list.indexOf(schemaId);
      if (index > -1) {
        list.splice(index, 1);
      }
    });
  }

  async customize(configId: string, edit: (c: Customizer) => void | Promise<void>) {
    const configPath = `${Recipe.rimeUserDir}/${configId}.custom.yaml`;
    const customizer = new Customizer();

    try {
      await customizer.loadFromFile(configPath);
      edit(customizer);
      await customizer.saveToFile(configPath);
    } catch (e) {
      return;
    }
  }
}
