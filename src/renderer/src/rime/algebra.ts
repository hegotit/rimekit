interface SpellingProps {
  threads?: Spelling[];
  text?: string;
  type?: string;
  syllables?: string[];
  ancestor?: Spelling;
  modifier?: Calculation;
}

export class Spelling {
  text: string;
  type: string;
  syllables: string[];
  ancestor?: Spelling;
  modifier?: Calculation;
  threads?: Spelling[];
  previous?: Spelling;

  constructor(props: SpellingProps) {
    this.text = props.text ?? '';
    this.type = props.type ?? 'normal';
    this.syllables = props.syllables ?? [this.text];
    this.ancestor = props.ancestor;
    this.modifier = props.modifier;
    this.threads = props.threads;
  }

  toString() {
    return this.text;
  }
}

function enhancedRegexpReplace(str: string, left: RegExp, right: string): string {
  str = str.replace(left, right);

  const caseChangeExpr = /\\([UL]).*?(\\E|$)/;
  if (caseChangeExpr.test(right)) {
    while (caseChangeExpr.test(str)) {
      str = str.replace(caseChangeExpr, (text) => {
        let caseChange: () => string;
        if (text.slice(0, 2) === '\\U') {
          caseChange = String.prototype.toUpperCase;
        } else if (text.slice(0, 2) === '\\L') {
          caseChange = String.prototype.toLowerCase;
        } else {
          return text;
        }

        const end = text.slice(-2) === '\\E' ? -2 : text.length;
        return caseChange.apply(text.slice(2, end));
      });
    }
  }

  return str;
}

export interface Calculation {
  parse(args: string[]): Calculation | undefined;
  calculate(spelling: Spelling): Spelling[] | undefined;
}

class Transliteration implements Calculation {
  left!: string;
  right!: string;

  parse(args: string[]): Transliteration | undefined {
    if (args.length !== 2) {
      return undefined;
    }
    [this.left, this.right] = args;
    if (this.left.length !== this.right.length) {
      console.error('error parsing transliteration');
      return undefined;
    }
    return this;
  }

  calculate(spelling: Spelling): Spelling[] {
    const chars = spelling.text.split('');
    const xlitChars = chars.map((ch) => {
      const leftIndex = this.left.indexOf(ch);
      return leftIndex === -1 ? ch : this.right.charAt(leftIndex);
    });
    const result = xlitChars.join('');
    if (result === spelling.text) {
      return [spelling];
    } else {
      return [
        new Spelling({
          text: result,
          type: 'transliterated',
          syllables: [...spelling.syllables],
          ancestor: spelling,
          modifier: this,
        }),
      ];
    }
  }
}

class Transformation implements Calculation {
  left!: RegExp;
  right!: string;

  parse(args: string[]): Transformation | undefined {
    if (args.length !== 2) {
      return undefined;
    }
    try {
      this.left = new RegExp(args[0], 'g');
      this.right = args[1];
    } catch (error) {
      console.error(`error parsing transformation: ${error}`);
      return undefined;
    }
    return this;
  }

  calculate(spelling: Spelling): Spelling[] {
    const result = enhancedRegexpReplace(spelling.text, this.left, this.right);
    if (result === spelling.text) {
      return [spelling];
    } else {
      return [
        new Spelling({
          text: result,
          type: 'transformed',
          syllables: [...spelling.syllables],
          ancestor: spelling,
          modifier: this,
        }),
      ];
    }
  }
}

class Erasion implements Calculation {
  pattern!: RegExp;

  parse(args: string[]): Erasion | undefined {
    if (args.length !== 1) {
      return undefined;
    }
    try {
      this.pattern = new RegExp(args[0], 'g');
    } catch (error) {
      console.error(`error parsing erasion: ${error}`);
      return undefined;
    }
    return this;
  }

  calculate(spelling: Spelling): Spelling[] {
    if (this.pattern.test(spelling.text)) {
      return [];
    } else {
      return [spelling];
    }
  }
}

class Derivation extends Transformation {
  parse(args: string[]): Derivation | undefined {
    const calc = super.parse(args);
    if (!calc) {
      return undefined;
    }
    return calc as Derivation;
  }

  calculate(spelling: Spelling): Spelling[] {
    const result = super.calculate(spelling);
    if (result[0] !== spelling) {
      result[0].type = 'derived';
      result[0].modifier = this;
      result.push(spelling);
    }
    return result;
  }
}

class Fuzzing extends Derivation {
  parse(args: string[]): Fuzzing | undefined {
    const calc = super.parse(args);
    if (!calc) {
      return undefined;
    }
    return calc as Fuzzing;
  }

  calculate(spelling: Spelling): Spelling[] {
    const result = super.calculate(spelling);
    if (result[0] !== spelling) {
      result[0].type = 'fuzzy';
      result[0].modifier = this;
    }
    return result;
  }
}

class Abbreviation extends Derivation {
  parse(args: string[]): Abbreviation | undefined {
    const derivation = super.parse(args);
    if (!derivation) {
      return undefined;
    }
    return derivation as Abbreviation;
  }

  calculate(spelling: Spelling): Spelling[] {
    const result = super.calculate(spelling);
    if (result[0] !== spelling) {
      result[0].type = 'abbrev';
      result[0].modifier = this;
    }
    return result;
  }
}

function create(operator: string): Calculation | undefined {
  if (!operator) {
    console.error('Invalid operator: failing to create Calculation instance');
    return undefined;
  }
  let calc: Calculation | undefined;
  switch (operator) {
    case 'abbrev':
      calc = new Abbreviation();
      break;
    case 'fuzz':
      calc = new Fuzzing();
      break;
    case 'erase':
      calc = new Erasion();
      break;
    case 'derive':
      calc = new Derivation();
      break;
    case 'xlit':
      calc = new Transliteration();
      break;
    case 'xform':
      calc = new Transformation();
  }

  return calc;
}

function parseFormula(formula: string): Calculation | undefined {
  const sep = formula.search(/[^a-z]/);
  if (sep === -1) {
    console.error('Invalid calculation: missing separator');
    return undefined;
  }

  const separator = formula.charAt(sep);
  const operands = formula.split(separator);

  if (formula.charAt(formula.length - 1) === separator) {
    operands.pop(); // Remove trailing separator
  }

  const operator = operands.shift();
  if (!operator) {
    console.error(`Unknown calculation: ${operator}`);
    return undefined;
  }

  const calc: Calculation | undefined = create(operator);

  if (!calc) {
    console.error(`Error creating calculation: ${operator}`);
    return undefined;
  }

  return calc.parse(operands);
}

export class Rule {
  formula!: string;
  calc?: Calculation | undefined;
  error: boolean;
  spelling?: Spelling;
  script!: Script;

  constructor(formula: string) {
    this.formula = formula;
    if (this.formula) {
      this.calc = parseFormula(this.formula);
    } else {
      this.formula = '<無>';
    }
    this.error = !this.calc;
  }

  calculate(spelling: Spelling): Spelling[] | undefined {
    if (this.error) {
      return [spelling];
    } else {
      const result: Spelling[] | undefined = this.calc?.calculate(spelling);
      if (result && result.length > 0) {
        this.spelling = result[0];
      }
      return result;
    }
  }
}

export class Script {
  mapping: { [key: string]: Spelling };
  previous?: Script;

  // getMapping(): { [p: string]: Spelling } {
  //   return this.mapping;
  // }
  //
  // setMapping(value: { [p: string]: Spelling }) {
  //   this.mapping = value;
  // }
  //
  // getPrevious(): Script {
  //   return <Script>this.previous;
  // }
  //
  // setPrevious(value: Script) {
  //   this.previous = value;
  // }

  static fromSyllabary(syllabary: string[]): Script {
    const script = new Script();
    for (const x of syllabary) {
      script.mapping[x] = new Spelling({
        text: x,
      });
    }
    return script;
  }

  constructor(mapping: { [key: string]: Spelling } = {}) {
    this.mapping = mapping;
  }

  toString(): string {
    return Object.keys(this.mapping).join(' ');
  }

  getSpellings(): Spelling[] {
    return Object.values(this.mapping);
  }

  query(pattern: RegExp): Script {
    const s = new Script();
    for (const [k, v] of Object.entries(this.mapping)) {
      if (pattern.test(k)) {
        s.mapping[k] = v;
      }
    }
    return s;
  }

  queryPrevious(previous: Script): Script {
    const s = new Script();
    const prevSpellings = previous.getSpellings();
    if (prevSpellings.length === 0) {
      return s;
    }

    for (const [key, spelling] of Object.entries(this.mapping)) {
      if (prevSpellings.includes(spelling)) {
        s.mapping[key] = spelling;
      } else if (spelling.ancestor && prevSpellings.includes(spelling.ancestor)) {
        s.mapping[spelling.ancestor.text] = spelling.ancestor;
      } else if (spelling.threads) {
        for (const w of spelling.threads) {
          if (prevSpellings.includes(w)) {
            s.mapping[w.text] = w;
            break;
          } else if (w.ancestor && prevSpellings.includes(w.ancestor)) {
            s.mapping[w.ancestor.text] = w.ancestor;
            // break;
          }
        }
      }
    }

    this.previous = s;
    return s;
  }

  queryNext(next: Script): Script {
    const s = new Script();
    const currSpellings = this.getSpellings();
    if (currSpellings.length === 0) {
      return s;
    }

    for (const [key, spelling] of Object.entries(next.mapping)) {
      if (currSpellings.includes(spelling) ?? (spelling.ancestor && currSpellings.includes(spelling.ancestor))) {
        s.mapping[key] = spelling;
      } else if (spelling.threads) {
        for (const w of spelling.threads) {
          if (currSpellings.includes(w) ?? (w.ancestor && currSpellings.includes(w.ancestor))) {
            s.mapping[key] = spelling;
            break;
          }
        }
      }
    }

    s.previous = this;
    return s;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Algebra {
  rules: Rule[];

  constructor(rules: Rule[]) {
    this.rules = rules;
  }

  formatString(str: string): string {
    let spelling = new Spelling({
      text: str,
    });
    for (const r of this.rules) {
      const a = r.calculate(spelling);
      if (!a || a.length === 0) {
        return '';
      }
      let next = a[0];
      if (next === spelling) {
        next = new Spelling(spelling);
      }
      next.previous = spelling;
      spelling = r.spelling = next;
    }
    return spelling.text;
  }

  makeProjection(script: Script): Script {
    for (const r of this.rules) {
      const next = new Script();
      for (const w of Object.values(script.mapping)) {
        const a = r.calculate(w);
        if (!a) {
          continue;
        }
        for (const x of a) {
          if (!(x.text in next.mapping)) {
            next.mapping[x.text] = x;
            continue;
          }
          let y = next.mapping[x.text];
          if (y.type !== 'merged') {
            y = next.mapping[x.text] = new Spelling({
              text: x.text,
              type: 'merged',
              syllables: [...y.syllables],
              threads: [y],
              modifier: r.calc,
            });
          }
          for (const s of x.syllables) {
            if (!y.syllables.includes(s)) {
              y.syllables.push(s);
            }
          }
          y.threads?.push(x);
        }
      }
      next.previous = script;
      script = r.script = next;
    }
    return script;
  }
}
