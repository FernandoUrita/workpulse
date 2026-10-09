# Sidebar minimize and Project table fit

Copy this patch's src contents into your existing src folder and replace matching files. No SQL or dependency changes. Run npm run build then refresh the browser.

Desktop: use the double-arrow button at the top of the sidebar. Minimized mode shows navigation icons with tooltips and remembers your preference. Mobile retains its full drawer.

Project tables default to Fit mode, with wrapped text and compact cells. All 15 data columns plus Review and Actions remain visible. When the content area has roughly 1100 pixels of available width, the table fits without horizontal scrolling. Minimize the sidebar to make more room. On narrower screens, horizontal scroll remains so the columns remain usable. Detailed width switches back to larger cells and horizontal scrolling.

Production build and targeted lint passed. Browser visual testing was not performed here.
