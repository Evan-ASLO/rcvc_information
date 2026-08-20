# RCVC website

This is a static website, so it can be edited directly on GitHub without a build step.

## Where to make routine updates

| Update | File |
| --- | --- |
| Research articles and publication links | `content/home.js` |
| Partner names and links | `content/home.js` |
| LinkedIn feature and testimonials | `content/home.js` |
| Team members, roles, and LinkedIn profiles | `content/team.js` |
| Upcoming events, registration links, and the past highlight | `content/events.js` |
| Shared RCVC links and footer details | `content/site.js` |
| Logo and video | `assets/` |

The files in `content/` are intentionally plain JavaScript objects. Preserve commas, quotes, braces, and brackets when editing them.

## Add a research article

1. Open `content/home.js`.
2. Copy an existing object inside `window.RCVC_RESEARCH`.
3. Update its `category`, `tag`, `title`, `summary`, `details`, `meta`, and `url`.
4. Commit the change.

Use one of these categories so the filters continue to work: `markets`, `diligence`, or `founders`.

## Update a team member

1. Open `content/team.js`.
2. Find the person's current team and role.
3. Update `name`, `role`, or `linkedin`.
4. Use the full LinkedIn URL. Leave `linkedin` empty to keep the profile private.
5. If filling a vacancy, remove `placeholder: true` from that record.

For a vacant role, use:

```js
{ name: "To be announced", role: "Role name", linkedin: "", placeholder: true }
```

## Add an event

1. Open `content/events.js`.
2. Copy the commented example into `window.RCVC_EVENTS`.
3. Update every field and remove the comment markers.
4. Use one of these categories: `summit`, `workshop`, `visit`, or `community`.
5. Commit the change.

## Site structure

```text
assets/             Images and video
content/            Frequently edited site content
scripts/            Page behavior and animations
styles/             Page design
index.html          Home page
who-we-are.html     Team page
events.html         Events page
```

`rcvc-website.html` is retained only as a redirect for old links. New links should use `index.html`.
