# Reading a water meter from a photo

**Goal:** take a photo of a water meter and get the reading (the numbers) out of it, in a React app.

_Researched: 2026-11-02_

## Option 1: Tesseract.js (in the browser)

[Tesseract.js](https://github.com/naptha/tesseract.js) is an OCR library (OCR means reading text from an image). It runs in the browser through WebAssembly. It isn't React-specific, but it works fine in a React app.

```bash
yarn add tesseract.js
```

**Pros**

- Free.
- Works offline, and the photo never leaves the device.

**Cons**

- It was built for printed documents, not meters.
- Meters are hard to read: glare on the glass, odd angles, and rolling digits that sit halfway between two numbers.
- Expect misreads unless you prepare the image first.

**How to make it read better**

- Crop the photo to just the digit window.
- Only allow digits: `tessedit_char_whitelist: "0123456789"`.
- Pre-process the image: convert to grayscale, raise the contrast, then make it pure black and white.

## Option 2: An AI vision model (e.g. the Claude API)

Send the photo to a vision-capable model and ask it for the meter reading.

**Pros**

- Much better with glare, angles and rolling digits.
- Can return structured output, such as `{ "reading": "00123.45" }`.

**Cons**

- Small cost per photo.
- Needs a small backend so the API key is never shipped to the browser.
- The photo goes to a third-party service.

## Recommendation

1. Start with **Tesseract.js**. Test it on 5–10 real photos of the meter.
2. If it misreads too often, switch to **Option 2** behind a small backend.
