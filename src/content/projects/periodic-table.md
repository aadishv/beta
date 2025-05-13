---
date: '2025-03-15'
title: 'Interactive Periodic Table'
description: 'A modern, interactive periodic table with detailed element information designed for chemistry students'
image: '/assets/projects/periodic/thumbnail.png'
---

This started off as a simple project to try out web technologies, Tailwind CSS, and JS best practices -- and to fulfill my dire need for an actually well-designed periodic table. It eventually grew quite a bit, with many more features than initially imagined and several of my classmates at OHS using it.

## Features

- (Obviously) all 118 elements
- Colorful elements based on the scheme of the [Google Arts Experiments periodic table ↗](https://artsexperiments.withgoogle.com/periodic-table/)
- Click on an element to see a bunch of cool details about it:
  - Electron configuration (abbreviated and extended)
  - Atomic mass
  - Electronegativity
  - Oxidation states
  - Fun fact
- Fuzzy search that lets it read your mind and know you meant to type "praseodymium" instead of "preasdfdtyuhguim"
- _Super_-helpful formula mass calculator for any compound
- A reference tab full of helpful images to have in a chem class

## Tech stack

- React (mainly for the component hierarchy with a few `useState` hooks)
- Tailwind CSS (for styling)
- Astro (for static site generation, SSR, and preloading, as well as the header components)
- Fun fact: the entire codebase is in one JSX file! (send help)

## Changelog

This only includes major releases (~every 5-15 commits).

### v1.0: Full launch

_03/21/25_
[Check out the code](https://github.com/aadishv/aadishv.github.io/blob/main/src/components/PeriodicTable.jsx)

<br>
This was a complete rewrite of the periodic table to accompany the launch of my redesigned, Astro-based website. The old one looked a little terrible and had incoherent design (not to mention the incompatible design choices with the rest of my sites), but this has a very unified structure across my entire website. For example, it now sticks to just two fonts and two colors. The last release used Shoelace web components, which were nice for their simple and elegant design + DX, but now I've switched to custom-built components for better styling. This release doesn't add much functionality, per se, but it's still a major overhaul in terms of design and usability.

#### New features

- Added a reference tab full of helpful images to have in a chem class

#### Improvements

- Much faster page loading thanks to some Astro magic
- Improved accessibility with better keyboard navigation and screen reader support
- As alluded to above, vastly improved styling choices

### v0.2: HTML website

_01/01/25_
[Check out the code](https://github.com/aadishv/aadishv.github.io/tree/astro-rewrite/static/periodic)

<br>
(Note that v0.1 was a small SwiftUI prototype.)

This is a soft launch of a public version of my periodic table, featuring a simple design mirroring the SwiftUI version and going beyond with Shoelace web components. It's a bit more polished than the previous version, with better styling and more features.

#### Features

- Can now use "tab" to navigate between elements
- Works on web 👑
- Basic formula mass calculator
- A fun random element button! 🎲

#### Tech stack

- Raw HTML and JS
- Tailwind imported through the CDN
- No build step
