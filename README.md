# Winded

Just CSS in HTML.

[Visit the webpage](https://thescottyjam.github.io/winded/).

## How to use

In your HTML, add some inline CSS as follows:

```html
<p data-css="color: purple; &:hover { font-weight: bold }">
  Hey, that's neat
</p>
```

Then run the following to build a CSS file for your HTML

```sh
npx winded --include "src/**/*.html" --output build/output.css
```

The build tool will find all occurrences of data-css="..." in your files and add them to a CSS file. (The double quotes are required).

See `npx winded --help` for more options.

That's it.
