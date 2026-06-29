# Hens Heist: The Dymala Affair

Mobile-first scavenger-hunt web app for Alanna's Paris bachelorette night.

## Version 5

Adds:

- Netlify Function backend + Netlify Blobs shared progress storage.
- Live cross-phone leaderboard, with local fallback.
- Tiered random clue order so direct La Liquiderie clues only appear late.
- Intelligence grading explainer.
- Team-specific emojis.
- Header line illustrations.
- Completed card flip with stamped archive styling.
- New clue reveal animation in a detective-chic / Pink Panther-esque style.
- Subtle phone vibration on clue unlock where supported by the device/browser.

## Deploying

This version should be deployed through GitHub → Netlify, not as a manual drag-and-drop ZIP, because it includes a Netlify Function.

1. Create a GitHub repository.
2. Upload the contents of this folder.
3. In Netlify, choose **Add new site → Import an existing project**.
4. Connect the GitHub repository.
5. Use the default build settings.
6. Deploy.

Netlify will install dependencies from `package.json` and deploy the function in `netlify/functions/progress.js`.

## Local fallback

If the backend is unavailable, the app still works on one phone using local browser storage. The leaderboard will show local fallback status.


## Version 8
Save-the-date inspired visual refresh: gem field background, cream cotton-paper panels, burgundy/cream/gold palette, typewriter labels, script title treatment, and simplified stationery-style buttons/tabs/cards.
