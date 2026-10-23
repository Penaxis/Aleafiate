# Aleafiate Health Clinics — website

Open `index.html` in a browser (double-click). Works offline — all animation libraries are in `js/vendor/`.
Fonts load from Google Fonts when online (falls back to Georgia / system font offline).

## Structure
- index.html — Home
- about.html — About
- terms-and-conditions.html — Terms & Conditions
- privacy-policy.html — Privacy Policy
- travel-policy.html — Travel Policy (legal page template)
- practitioners.html — Meet Our Prescribing Practitioners (filter + profile drawer)
- faq.html — FAQ (search, section nav, accordions)
- contact.html — Contact (info cards, request form, map)
- home-v2.html — Alternative home page (self-contained: its CSS and JS are inline; uses the shared js/vendor/ libraries)
- css/style.css — all styles (colours & fonts at the top in :root)
- js/main.js — all animations (driven by data-attributes, see comment at top)
- js/vendor/ — GSAP 3.13 (ScrollTrigger, SplitText, Draggable) + Lenis
- images/ — one folder per page; each folder's README lists the file names, sizes and AI prompts
  - images/brand/ — logos
  - images/home/ — homepage (index.html)
  - images/practitioners/ — practitioner photos (also used on the homepage) and the practitioners page
  - images/about/, images/home-v2/, images/contact/, images/faq/ — the other pages

## Adding images
Every placeholder is `<img src="" alt="">` with a size label.
Change it to `<img src="images/your-photo.jpg" alt="Describe the photo">` — the label disappears automatically.

## Rebranding
Brand colours are at the top of css/style.css. Logos live in images/brand/ (aleafiate-logo.png for light backgrounds, aleafiate-logo-white.png for the footer).

## Practitioners
Each practitioner is one `<article class="doc">` in practitioners.html. Edit the `data-name`, `data-role`,
`data-reg` and `data-cat` (doctor / nurse / pharmacist) attributes, the visible text, and the `<template>`
inside it — that template is what shows in the profile panel. Update the tab counts if you add or remove people.

## Contact form
By default the form opens the visitor's email app, addressed to `data-mailto` on the `<form>`.
To receive requests directly, sign up to a form service (e.g. Formspree) and put its URL in `action=""`.
