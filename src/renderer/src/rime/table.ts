import { promises as fs } from 'fs';
import * as path from 'path';
import Trie from 'trie-search';

const EPSILON = 1e-10;

export class Table {
  dictName!: string;
  formatVersion!: number;

  private trie?: Trie<Buffer>;
  private syllabary!: string[]; // require('@rushstack/eslint-patch/modern-module-resolution')

  async loadFile(filePath: string) {
    const buffer = await fs.readFile(filePath);

    this.dictName = path.posix.basename(filePath, '.table.bin');

    const format = this.getString(buffer);
    const versionMatch = /^Rime::Table\/(\d+\.\d+)/.exec(format);
    if (!versionMatch) {
      throw new Error('');
    }
    this.formatVersion = parseFloat(versionMatch[1]);

    if (this.formatVersion > 2.0 - EPSILON) {
      this.trie = this.loadTrie(buffer);
    }

    this.syllabary = this.getSyllabary(buffer);

    this.trie = undefined; // release memory
  }

  private loadTrie(buffer: Buffer): Trie<Buffer> {
    const stringTableOffset = 60 + buffer.readUInt32LE(60);
    const stringTableSize = buffer.readUInt32LE(64);

    const trieBuffer = buffer.subarray(stringTableOffset, stringTableOffset + stringTableSize);

    const trie = new Trie<Buffer>();
    trie.add(trieBuffer);
    return trie;
  }

  private getSyllabary(buffer: Buffer) {
    const getSyllable = this.formatVersion > 2.0 - EPSILON ? this.getSyllableV2 : this.getSyllableV1;

    const syllabaryOffset = 44 + buffer.readUInt32LE(44);
    const numSyllables = buffer.readUInt32LE(syllabaryOffset);

    const syllabary: string[] = [];

    let offset = syllabaryOffset + 4;
    for (let i = 0; i < numSyllables; i++) {
      syllabary.push(getSyllable.call(this, buffer, offset));
      offset += 4;
    }

    return syllabary;
  }

  private getSyllableV2(buffer: Buffer, offset: number) {
    const stringId = buffer.readUInt32LE(offset);

    const entry = this.trie?.get(stringId.toString());

    const syllable: string | undefined = entry
      ?.map((buffer) => buffer.toString())
      .reduce((accumulator, currentValue) => accumulator + currentValue);

    return syllable ?? '';
  }

  private getSyllableV1(buffer: Buffer, offset: number) {
    const entryOffset = offset + buffer.readInt32LE(offset);
    return this.getString(buffer, entryOffset);
  }

  private getString(buffer: Buffer, offset?: number) {
    if (!offset) {
      offset = 0;
    }
    let end = offset;
    while (buffer[end] !== 0) end++;

    return buffer.toString('utf8', offset, end);
  }
}
