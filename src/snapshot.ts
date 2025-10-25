import { isObjectLike } from 'lodash-es';

/**
 * Allows special objects (Error, Headers, Set) to be included in JSON.stringify output
 * functions are removed
 */
export function snapshot(i: unknown): any {
  if (Array.isArray(i)) return i.map(snapshot);
  if (typeof i === 'function') return undefined;
  if (!isObjectLike(i)) return i;

  let output: Record<string, any> = {};
  // @ts-ignore If it has an 'entries' function, use that for looping (eg. Set, Map, Headers)
  if (typeof i.entries === 'function') {
    // @ts-ignore
    for (let [k, v] of i.entries()) {
      output[k] = snapshot(v);
    }
    return output;
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties

  // Get Enumerable, inherited properties
  const obj: Record<string, any> = i!;
  for (let key in obj) {
    output[key] = snapshot(obj[key]);
  }

  // Get Non-enumberable, own properties
  Object.getOwnPropertyNames(obj).forEach(key => {
    output[key] = snapshot(obj[key]);
  });

  return output;
}
