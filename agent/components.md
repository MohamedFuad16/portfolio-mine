# Components

- `App`: page composition and section order.
- `SectionTitle`: dashed-corner heading label matching the reference site.
- `SkillPill`: `react-icons` component/text skill item inside two slower opposite-direction animated marquee rows; animation pauses on hover.
- `BrandIcon`: local `react-icons` helper for LinkedIn and GitHub button icons.
- Hero name action: animated red rocket button next to the name; click plays a short Web Audio chime and particle burst.
- Page click effect: any ordinary page click plays a short Web Audio chime and shows a small ring/particle burst at the pointer.
- Locale toggle: defaults from browser language, remembers user choice, and switches the page copy between English and Japanese from the profile handle row.
- QR flip avatar: profile image flips in 3D to show `public/assets/linkedin-qr.png`, with the QR control toggling photo/back side.
- `ContributionGrid`: GitHub-style activity grid populated from the public MohamedFuad16 contributions API with a local fallback.
- `ExperienceItem`: timeline row with official logo, date/status chip, and expandable bullet details.
- `ProjectCard`: dashed project row with a captured live-site preview, bottom-right badge, actions, localized description, and tech tags.
