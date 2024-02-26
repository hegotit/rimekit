import * as process from 'node:process';
import { Hive, Registry } from 'winreg2';

const queryRegistry = async (hive: Hive, reg: string, key: string) => {
  const regKey = new Registry({
    hive: hive,
    key: `${reg}`,
  });

  try {
    const items = await regKey.values();
    const item = items.find((item) => item.name === key);
    return item?.value;
  } catch (err) {
    console.error('Error querying the registry:', err);
    throw err;
  }
};

export class RimeConfigService {
  static async customRimeUserDir(): Promise<string | undefined> {
    try {
      return await queryRegistry(Hive.HKCU, '\\Software\\Rime\\Weasel', 'RimeUserDir');
    } catch {
      console.warn('could not access Windows registry for user dir.');
      return undefined;
    }
  }

  static async weaselInstallDir(): Promise<string | undefined> {
    try {
      return await queryRegistry(Hive.HKLM, '\\Software\\Rime\\Weasel', 'WeaselRoot');
    } catch {
      console.warn('could not access Windows registry for weasel install dir.');
      return undefined;
    }
  }

  static async getRimeUserDir(): Promise<string[] | undefined> {
    if (process.platform === 'darwin') {
      const home = process.env['HOME'] || '.';
      return [`${home}/Library/Rime`, '/Library/Input Methods/Squirrel.app/Contents/SharedSupport'];
    } else if (process.platform === 'linux') {
      const home = process.env['HOME'] || '.';
      return [`${home}/.config/ibus/rime`, '/usr/share/rime-data'];
    } else if (process.platform === 'win32') {
      const appdata = process.env['APPDATA'];
      return [(await this.customRimeUserDir()) || `${appdata}\\Rime`, `${await this.weaselInstallDir()}\\data`];
    } else {
      return undefined;
    }
  }
}
