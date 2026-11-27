# Portfolio
Personal portfolio showcasing my expertise in AI Engineering, Data Analytics, Data Engineering, and Business Intelligence. Featuring real-world projects, technical skills, professional experience, certifications, and achievements using Python, FastAPI, OpenAI Agents SDK, SQL, Power BI, and Tableau.

## Motion controls

Hold the left mouse button and drag the portrait, a role card, or a skill panel. Horizontal movement turns its visual side to side, vertical movement tips it up or down, and diagonal movement combines both. Release to reset. Each role card has a short description on its back. Education and experience cards use the same gesture with a smaller tilt.

On a touchscreen, start a one-finger swipe sideways on the same cards, then move diagonally to turn both axes. Lift your finger to reset. A vertical swipe scrolls the page, and tapping a role opens its skills. Reduced-motion mode disables rotations and decorative press effects.

The site runs directly from `index.html`. The motion controllers use browser APIs in `motion.js`, and their visual treatments are in `motion.css`.

Adjust `settings` in `motion.js` for card rotation, label movement, background network density and simulation timing. The CSS properties `--spot-radius`, `--beam-period` and `--orbit-period` control the spotlight and portrait effects.

The reactor cursor uses a 6px cyan dot at the pointer and a 24px white ring that expands to 36px over controls and cards. Edit the custom properties on `.mouse-halo` in `motion.css` for diameters, colors, stroke, glow and both orbit periods. Keep `--reactor-white` at `#FFFFFF` for the primary ring. In `motion.js`, `cursorSettings` controls tracking at 60 Hz, magnetic strength and travel, particle counts, distance and lifetimes. The shared particle pool is capped at 60. Set `data-motion-off="cursor"` on the HTML element to use the native pointer throughout.

To disable individual effects, add a space-separated `data-motion-off` attribute to the opening HTML element and reload. For example, `<html lang="en" data-motion-off="turns beam">` disables hover rotations and traveling borders. Other supported values are `cursor`, `magnet`, `parallax`, `float`, `orbit`, `network`, `spotlight`, `flip`, `timeline`, and `reveal`. The user's reduced-motion preference takes precedence.

Open Phoenix AI’s recovery workflow and choose **Run simulation** to follow a predefined timeout incident. Closing the disclosure, scrolling away, or switching browser tabs pauses the demonstration. **Reset** returns it to the healthy sample state.
