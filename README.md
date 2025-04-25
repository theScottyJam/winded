# Winded

Just CSS in HTML.

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

See `npx winded --help` for more options.

That's it.
