# Portfolio
Personal portfolio showcasing my expertise in AI Engineering, Data Analytics, Data Engineering, and Business Intelligence. Featuring real-world projects, technical skills, professional experience, certifications, and achievements using Python, FastAPI, OpenAI Agents SDK, SQL, Power BI, and Tableau.

## Motion controls

Hold the right mouse button and drag horizontally to turn the portrait or role cards. Each role has a short description on its back. Drag vertically on a skill panel to turn its visual. Release to reset. Education and experience cards use a smaller right-drag tilt.

The site runs directly from `index.html`. The motion controllers use browser APIs in `motion.js`, and their visual treatments are in `motion.css`.

Adjust the `settings` object near the top of `motion.js` to change the rotation travel per right-button drag (`turnDegrees`), magnetic travel, particle counts, or simulation stage duration. The CSS properties `--cursor-ring`, `--spot-radius`, `--beam-period`, and `--orbit-period` control the cursor, spotlight, and border and orbit timing.

To disable individual effects, add a space-separated `data-motion-off` attribute to the opening HTML element and reload. For example, `<html lang="en" data-motion-off="turns beam">` disables hover rotations and traveling borders. Other supported values are `cursor`, `magnet`, `parallax`, `float`, `orbit`, `network`, `spotlight`, `flip`, `timeline`, and `reveal`. The user's reduced-motion preference takes precedence.

Open Phoenix AI’s recovery workflow and choose **Run simulation** to follow a predefined timeout incident. Closing the disclosure, scrolling away, or switching browser tabs pauses the demonstration. **Reset** returns it to the healthy sample state.
