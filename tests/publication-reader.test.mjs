import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('the reading outline observes and highlights percent-encoded Arabic fragments', () => {
  const sections = [{id: 'مقدمة'}, {id: 'الجهاز-الهضمي'}];
  const links = sections.map(section => ({
    hash: '#' + encodeURIComponent(section.id), attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
  }));
  const observed = [];
  let notify;
  class IntersectionObserver {
    constructor(callback) { notify = callback; }
    observe(section) { observed.push(section); }
  }
  vm.runInNewContext(readFileSync('assets/publication-reader.js', 'utf8'), {
    window: {IntersectionObserver}, IntersectionObserver,
    document: {
      querySelector: () => null, querySelectorAll: () => links,
      getElementById: id => sections.find(section => section.id === id),
    },
  });
  assert.deepEqual(observed, sections);
  notify([{isIntersecting: true, target: sections[1]}]);
  assert.equal(links[1].attributes['aria-current'], 'location');
  assert.equal(links[0].attributes['aria-current'], undefined);
});
