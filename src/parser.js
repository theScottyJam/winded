const DATA_CSS_PATTERN = /\bdata-css\s*=\s*"(?<css>.*?)"/gs

export function extractCssAttributes(fileContents) {
  return fileContents.matchAll(DATA_CSS_PATTERN)
    .map(match => match.groups.css)
    .toArray();
}

/**
 * Given a list of CSS declaration blocks, this
 * function will figure out how much text needs to be used in an attribute selector
 * to uniquely identify a given attribute, and then return the selector information
 * for each declaration block.
 */
export function buildRulesets(cssDeclarationBlocks) {
  const ruleSets = [];
  declarationBlockLoop: for (const cssDeclarationBlock of cssDeclarationBlocks) {
    // The index where this declaration block's text starts becoming unique compared to all others.
    let uniqueCharIndex = 0;

    for (const ruleset of ruleSets) {
      if (cssDeclarationBlock === ruleset.declarationBlock) {
        // Skip this declaration block, it's already accounted for.
        continue declarationBlockLoop;
      }

      // if this is true, it means our tentative selector plan for this ruleset
      // isn't unique enough, and we'll need to make the selector larger.
      if (cssDeclarationBlock.startsWith(ruleset.attrSelectorValue)) {
        const smallestTextLength = Math.min(ruleset.declarationBlock.length, cssDeclarationBlock.length);
        let i;
        let foundMismatch = false;
        // Figuring out how much larger we need to make the selector.
        for (i = ruleset.attrSelectorValue.length; i < smallestTextLength; i++) {
          if (cssDeclarationBlock[i] !== ruleset.declarationBlock[i]) {
            foundMismatch = true;
            break;
          }
        }

        // If no mismatch was found, it means we've reached the end of one of the two strings.
        const startOfTextMismatch = foundMismatch ? i : smallestTextLength;
        // Adding 1 to `startOfTextMismatch`, because we need at least one unique character in it.
        ruleset.attrSelectorValue += ruleset.declarationBlock.slice(ruleset.attrSelectorValue.length, startOfTextMismatch + 1);
        uniqueCharIndex = Math.max(uniqueCharIndex, startOfTextMismatch);
      }
    }

    // Adding 1 to `uniqueCharIndex`, because we need at least one unique character in it.
    ruleSets.push({
      attrSelectorValue: cssDeclarationBlock.slice(0, uniqueCharIndex + 1),
      declarationBlock: cssDeclarationBlock,
    });
  }

  return ruleSets;
}

export function buildStylesheet(ruleSets) {
  return ruleSets.map(ruleSet => {
    const operator = ruleSet.attrSelectorValue.length === ruleSet.declarationBlock.length ? '=' : '^=';

    // Do some minimal pretty-printing
    let leftPad = '';
    let rightPad = '';
    if (!ruleSet.declarationBlock.includes('\n')) {
      leftPad = ' ';
      rightPad = ' ';
    } else {
      if (!ruleSet.declarationBlock.startsWith('\n')) leftPad = '\n';
      if (!ruleSet.declarationBlock.endsWith('\n')) rightPad = '\n';
    }

    // Newlines are escaped with `\A`,
    // and if a space follows the newline, CSS will ignore it,
    // which is why we need to add an extra space to give it something to ignore.
    const attrSelectorValue = ruleSet.attrSelectorValue
      .replaceAll('\n ', '\\A  ')
      .replaceAll('\n', '\\A');

    return `[data-css${operator}"${attrSelectorValue}"] {${leftPad}${ruleSet.declarationBlock}${rightPad}}\n`;
  }).join('')
}
