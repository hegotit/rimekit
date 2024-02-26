import { Algebra, Rule, Script } from './algebra';

function test() {
  const ruleStr = `erase/^xx$/
xform/^([aoe])$/$1$1/
xform/^([aoe])(ng)$/Ⓔ$1$2/
derive/^([jqxy])u(.*)$/$1v$2/
xform/ian$/Ⓒ/
derive/Ⓒ/Ⓠ/
xform/ui$/え/
derive/え/Ⓥ/
xform/uo$/を/
xform/iang$/Ⓝ/
xform/iao$/Ⓜ/
xform/uang$|ve$/Ⓧ/
xform/uan$/Ⓩ/
xform/(.)eng$|van$/$1Ⓙ/
xform/ua$/Ⓠ/
xform/(.)ei$|vn$/$1Ⓦ/
xform/(.)ou$/$1Ⓡ/
xform/iu$/Ⓣ/
xform/ie$/Ⓟ/
xform/(.)ao$/$1Ⓢ/
xform/(.)an$/$1Ⓓ/
xform/(.)ang$/$1Ⓕ/
xform/uai$|ing$/Ⓖ/
xform/(.)ai$|ue$/$1Ⓗ/
xform/(.)en$|ia$/$1Ⓚ/
xform/i?ong$/Ⓛ/
xform/in$/Ⓑ/
xform/un$/Ⓨ/
xform/^sh/Ⓥ/
derive/Ⓥ([^uを])/Ⓞ$1/
xform/^zh/Ⓤ/
derive/Ⓤ([^aiえを])/Ⓐ$1/
xform/^ch/Ⓘ/
xlit/ⓆⓌⒺⓇⓉⓎⓊⒾⓄⓅⒶⓈⒹⒻⒼⒽⒿⓀⓁⓏⓍⒸⓋⒷⓃⓂをえ/qwertyuiopasdfghjklzxcvbnmon/`;

  const rules = ruleStr.split(/\n/).map((line) => {
    return new Rule(line);
  });

  const algebra = new Algebra(rules);
  const last = algebra.makeProjection(Script.fromSyllabary(['zhan']));

  console.log(JSON.stringify(last, (_k, v) => (v instanceof RegExp ? v.toString() : v)));

  // const list: Script[] = new Array<Script>();
  //
  // do {
  //     list.unshift(last);
  //     last = last.getPrevious();
  // } while (last.getPrevious() != null);
  //
  // for (let i = 0; i < list.length; i++) {
  //     console.log(i + 1 + "\t" + list[i]);
  // }
}
test();
