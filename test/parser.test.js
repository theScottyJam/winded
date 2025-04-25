import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractCssAttributes, buildRulesets, buildStylesheet } from '../src/parser.js';

describe('extractCssAttributes()', () => {
  it('it can extract data-css attribute values', () => {
    const declarationBlocks = extractCssAttributes([
      '<p data-css="abc"></p>',
      '<p data-css = "def"></p>',
      '<p data-css = "',
      '  ghi',
      '"></p>',
    ].join('\n'));

    assert.deepEqual(declarationBlocks, [
      'abc',
      'def',
      '\n  ghi\n',
    ]);
  });
});

describe('buildRulesets()', () => {
  it('it can build rulesets (test 1)', () => {
    const cssDeclarationBlocks = [
      'abc',
      'def',
      'abc123',
      'abc',
      'abc456',
    ];

    const rulesets = buildRulesets(cssDeclarationBlocks);

    assert.deepEqual(rulesets, [
      { attrSelectorValue: 'abc', declarationBlock: 'abc' },
      { attrSelectorValue: 'd', declarationBlock: 'def' },
      { attrSelectorValue: 'abc1', declarationBlock: 'abc123' },
      { attrSelectorValue: 'abc4', declarationBlock: 'abc456' },
    ]);
  });

  // The same test, but the items will be processed in the reverse order.
  it('it can build rulesets (test 2)', () => {
    const cssDeclarationBlocks = [
      'abc456',
      'abc',
      'abc123',
      'def',
      'abc',
    ];

    const rulesets = buildRulesets(cssDeclarationBlocks);

    assert.deepEqual(rulesets, [
      { attrSelectorValue: 'abc4', declarationBlock: 'abc456' },
      { attrSelectorValue: 'abc', declarationBlock: 'abc' },
      { attrSelectorValue: 'abc1', declarationBlock: 'abc123' },
      { attrSelectorValue: 'd', declarationBlock: 'def' },
    ]);
  });

  it('it can build rulesets (test 3)', () => {
    const cssDeclarationBlocks = [
      'Xab',
      'Xcd',
    ];

    const rulesets = buildRulesets(cssDeclarationBlocks);

    assert.deepEqual(rulesets, [
      { attrSelectorValue: 'Xa', declarationBlock: 'Xab' },
      { attrSelectorValue: 'Xc', declarationBlock: 'Xcd' },
    ]);
  });
});

describe('buildStylesheet()', () => {
  it('it can build a stylesheet', () => {
    const rulesets = [
      { attrSelectorValue: 'exactMatch', declarationBlock: 'exactMatch' },
      { attrSelectorValue: 'partial', declarationBlock: 'partialMatch' },
    ];

    const stylesheet = buildStylesheet(rulesets);

    assert.equal(stylesheet, [
      '[data-css="exactMatch"] { exactMatch }',
      '[data-css^="partial"] { partialMatch }',
      '',
    ].join('\n'));
  });

  it('it can build a stylesheet with whitespace-matching selectors', () => {
    const rulesets = [
      { attrSelectorValue: '\nnewLines\n', declarationBlock: '\nnewLines\n' },
      { attrSelectorValue: '\n  newLinesAndSpace\n', declarationBlock: '\n  newLinesAndSpace\n' },
    ];

    const stylesheet = buildStylesheet(rulesets);

    assert.equal(stylesheet, [
      '[data-css="\\AnewLines\\A"] {\nnewLines\n}',
      // There should be an extra space added after the \A for the CSS to ignore.
      '[data-css="\\A   newLinesAndSpace\\A"] {\n  newLinesAndSpace\n}',
      '',
    ].join('\n'));
  });
});
