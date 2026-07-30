# Punjabi Wedding Invitation Website

## How to open it

1. Extract the ZIP file.
2. Open the extracted folder.
3. Double-click `index.html`.

For the best result in VS Code:

1. Open the folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

## What to edit

Open `index.html` and replace:

- Sharan and Arsh
- Wedding date
- Event dates and times
- Venue name and address
- Punjabi quote
- Family information
- Google Maps link

Open `script.js` and change:

```js
const weddingDate = new Date("2026-10-18T10:00:00");
```

## Add music

Put an MP3 file inside the `assets` folder and name it:

`wedding-music.mp3`

Only use music that you are allowed to use.

## Add gallery photos

Put your photos inside `assets`, then replace a placeholder such as:

```html
<div class="photo-placeholder"><span>Add Couple Photo</span></div>
```

with:

```html
<img src="assets/couple-photo.jpg" alt="Sharan and Arsh" />
```

You may also add this CSS:

```css
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## RSVP note

The current RSVP form saves responses only in the visitor's browser using localStorage. It is a visual demo.

For a real invitation, connect the form to Firebase, Formspree, Google Sheets, or another backend.
