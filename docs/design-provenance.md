# Original interface and research provenance

Product structure, code, icon paths and sample product SVGs were written for this implementation. No product repository was forked. The general product categories are established ideas; originality here is the implementation and specific workflow, not a claim that no similar product exists.

Public design references:

* https://basecamp.com/ : project-centered workspaces and contextual tools.
* https://linear.app/now/behind-the-latest-design-refresh : quiet navigation and stable action placement.
* https://blog.superhuman.com/docs-new-visual-identity/ : coordinated type and icon language.
* https://www.framer.com/ : hierarchy, responsive layout and restrained motion.
* https://www.framer.com/help/articles/reduced-motion-settings/ : reduced motion behavior.

REA 6.8.0 from https://github.com/morluto/rea was used to inspect public pages through local Chrome debugging endpoints. The raw JSON captures are retained locally and excluded from the public repository. Basecamp, Linear and Framer produced usable public-page observations. Superhuman's browser page showed human verification, so its published article was used as the textual reference. No access challenge was bypassed and no private backend was inferred.

DM Sans and Instrument Serif are redistributed under their SIL Open Font Licenses, included in frontend/public/fonts. The typefaces are locally hosted. Brand assets, screenshots, page markup and source code from the reference products are not incorporated into the application interface.

The interface supports keyboard focus, native dialog focus containment, reduced motion, mobile layouts, explicit loading and failure states, and text labels beside actions. No animated scrolling library is necessary.
