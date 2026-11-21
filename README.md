# English → Dutch Vocab Quiz

A small static web app for practising English → Dutch vocabulary. No build step and no dependencies.

## Files

- `index.html` – page structure
- `style.css` – styling
- `app.js` – quiz logic
- `packs.js` – **your word packs (edit this one)**

## Adding word packs

Open `packs.js` and add entries to the `PACKS` list:

```js
{
  id: "food",
  name: "Food",
  description: "Things to eat",
  words: [
    { en: "bread", nl: "het brood" },
    { en: "apple", nl: "de appel" },
    { en: "pretty", nl: ["mooi", "knap"] }, // several accepted answers
  ],
},
```

Answers are checked ignoring capitals, extra spaces and accents. Articles (`de`/`het`) are checked, so include them only if you want to practise them. Both "het dorp" and "dorp, het" are accepted.

## Hosting on GitHub Pages

1. Create a new repository on GitHub and upload these four files to the root.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set Source to **Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. After a minute or so the site is live at `https://<your-username>.github.io/<repo-name>/`.

To test locally, just open `index.html` in a browser.
