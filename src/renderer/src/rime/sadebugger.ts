import * as fs from 'fs';
import * as diff from 'diff';
import { encode } from 'html-entities';
// import * as rime from "./rime"; // 确保Rime模块可以以这种方式被导入，或根据实际情况调整

const stringDiff = (x: any, element: any, attrs: any) => {
  const oldValue = x?.previous?.toString() ?? '';
  const newValue = x?.toString() ?? '';
  if (oldValue === newValue) {
    element.text(newValue);
    return;
  }
  const diffMethod = attrs.unit === 'char' ? diff.diffChars : diff.diffWords;
  const changes = diffMethod(oldValue, newValue);
  element.html(diff.convertChangesToXML(changes));
};

const scriptDiff = (x: any, element: any, attrs: any) => {
  if (!x?.previous) {
    element.text(x?.toString() ?? '');
    return;
  }

  const compareSpellingByText = (a: { text: string }, b: { text: string }) => {
    return a.text.localeCompare(b.text);
  };

  const os = x.previous.getSpellings().sort(compareSpellingByText);
  const ns = x.getSpellings().sort(compareSpellingByText);
  const changes: string[] = [];

  while (os.length > 0 && ns.length > 0) {
    const ot = os[0].text;
    const nt = ns[0].text;
    if (ot < nt) {
      os.shift();
      changes.push(`<del>${encode(ot)}</del>`);
    } else if (ot > nt) {
      ns.shift();
      changes.push(`<ins>${encode(nt)}</ins>`);
    } else {
      if (os.shift() !== ns.shift()) {
        changes.push(`<em>${encode(nt)}</em>`);
      } else {
        changes.push(encode(nt));
      }
    }
  }

  while (os.length > 0) {
    changes.push(`<del>${encode(os.shift()?.text)}</del>`);
  }

  while (ns.length > 0) {
    changes.push(`<ins>${encode(ns.shift()?.text)}</ins>`);
  }

  element.html(changes.join(' '));
};
