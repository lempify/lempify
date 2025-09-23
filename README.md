🚨 Lempify is actively being developed. It is not yet ready for public consumption. 🚨

# Lempify

Is a LEMP stack generation & local development tool.

# Dev

* Install and configure this [list of prerequisites](https://v2.tauri.app/start/prerequisites/), specifically ones pertaining to desktop apps.
* [Install PNPM](https://pnpm.io/installation).
* From the project root install dependencies `pnpm install`.
* Run `pnpm lempify:dev` to build and test Lempify.

### Todo:

\* = v2

- [ ] Port "_... in use_" recovery.
- [ ] Add DNS Server https://github.com/hickory-dns/hickory-dns *
- [x] Services:
    * Test Redis & Memcached connectivity.
    * Fix header pending state.
- [ ] Add composer, wp-cli steps
- [ ] Site (In Progress):
    * Full UI.
    * Make configurable: *
        * Name 
        * Root dir 
        * Php versions 
    * SQL Import *
    * Site export *
- [ ] Site Create Form:
    * Dialog: Fix UI, especially on Dark Mode.
    * Fix duplicate form ids/names.
- [ ] Responsive:
    * Header
    * Sidebar should close at smaller widths
- [ ] Dashboard
- [ ] Add WP CLI commands.
- [ ] Fix error logging.
- [ ] Brew install prompt
- [ ] MariaDB or MySQL *
- [ ] Screenshot *
- [ ] PHP Multi v8 version support *

### Screenshot:
![Lempify](screenshot.jpg)
