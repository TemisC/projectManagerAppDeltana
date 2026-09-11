# Login background images

The login screen randomly picks one of these on each page load (one per
mount, doesn't shuffle while the form is open):

- `hero-1.jpg`
- `hero-2.jpg`
- `hero-3.jpg`
- `hero-4.jpg`

Add, remove, or replace files here and update the `HERO_IMAGES` array in
`components/Login.tsx` to match. If none of these files exist, the panel
falls back to a plain dark gradient (no broken-image icon).
