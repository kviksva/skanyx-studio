Apple product bezels, downloaded by a human from Apple Design Resources
(https://developer.apple.com/design/resources/ > Product Bezels; the terms need
a click-through). Expected file: iphone-17-pro-black.png (or the current flagship),
straight-on, transparent background, with the screen cut-out. Record the inset
of the screen inside the image in src/components/PhoneFrame.tsx (`devices` table).
Until a file exists, PhoneFrame renders a CSS bezel flagged
data-phone-frame="css-fallback" and QA warns. Never ship the fallback.
