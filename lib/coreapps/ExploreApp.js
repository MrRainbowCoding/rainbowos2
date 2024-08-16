"use strict";
class ExploreApp extends App {
    hidden = false;
    constructor() {
        super();
        this.name = "Explore";
        this.icon = "/assets/icons/explore2.png";
        this.package = "anura.explore";
    }
    css = css `
        background-color: var(--theme-bg);
        color: var(--theme-fg);
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;

        #sidebar {
            width: 50%;
            padding: 2%;
            padding-left: 0;

            div {
                padding-block: 0.7rem;
                font-size: 1.1rem;
                border-radius: 0 9999px 9999px 0;
                padding-left: 1.25em;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
            }

            div.selected {
                color: color-mix(
                    in srgb,
                    var(--theme-accent) 35%,
                    var(--theme-fg)
                );
                background-color: color-mix(
                    in srgb,
                    var(--theme-accent) 30%,
                    transparent
                );
                font-weight: 700;
            }
        }

        h1 {
            font-size: 2em;
        }

        article {
            height: 100%;
            overflow-y: auto;
        }

        a,
        a:link {
            color: var(--theme-accent);
        }

        a:visited {
            color: var(--theme-accent);
        }

        #body {
            font-size: 1.05rem;
            padding: 1rem;

            p {
                margin-block: 0.5rem;
            }

            p img {
                width: 1.05rem;
                height: 1.05rem;
                margin-top: 0.5rem;
            }

            span:has(img) {
                /* display: flex; */
                gap: 0.2rem;
                align-items: center;
                font-weight: 600;
            }

            code {
                background-color: var(--theme-secondary-bg);
                padding: 0.1rem 0.3rem;
                border-radius: 0.2rem;
                font-family: "Roboto Mono", monospace;
            }

            h2 {
                margin-block: 1.5rem 0;
            }

            h2:first-of-type {
                margin-block-start: 0.25rem;
            }
        }

        .head {
            display: flex;
            flex-direction: row;

            gap: 1rem;
            align-items: center;

            img {
                width: 2.5rem;
                height: 2.5rem;
            }
        }

        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-thumb {
            background-color: var(--theme-secondary-bg);
            border-radius: 8px;
        }

        ::-webkit-scrollbar-button {
            display: none;
        }
    `;
    welcome = (h("div", { id: "body" },
        h("div", { class: "head" },
            h("img", { src: "/icon.png", alt: "AnuraOS Logo" }),
            h("h1", null, "Welcome to RainbowOS 2!")),
        h("h2", null, "What is RainbowOS?"),
        h("p", null, "RainbowOS is a desktop environment made for development that runs right in your browser, literally just AnuraOS but rebranded."),
        h("h2", null, "Getting Started"),
        h("p", null, "RainbowOS functions are now just like your average desktop! You can launch apps from the launcher (accessible via the button in the bottom-left, or pressing the Meta key), drag windows around, and pin apps to the taskbar. AnuraOS is visually based off of Google's ChromeOS."),
        h("h2", null, "Customize your experience"),
        h("p", null,
            "RainbowOS now has more robust customization features. You can change the wallpaper using",
            " ",
            h("span", null,
                h("a", { href: "javascript:anura.apps['anura.wallpaper'].open();" },
                    h("img", { src: "/assets/icons/wallpaper.png", alt: "Wallpaper Selector Icon" }),
                    " ",
                    "Wallpaper Selector")),
            ", and change the system colors using",
            " ",
            h("span", null,
                h("a", { href: "javascript:anura.apps['anura.ui.themeeditor'].open();" },
                    h("img", { src: "/assets/icons/themeeditor.png", alt: "Theme Editor Icon" }),
                    " ",
                    "Theme Editor")),
            "."),
        h("p", null, "For advanced users, RainbowOS can now execute any files in the /userInit folder as JavaScript code on boot. Which means you can now make malware for RainbowOS! Scary!")));
    state = $state({
        screen: this.welcome,
    });
    page = async () => (h("div", { class: this.css },
        h("div", { id: "sidebar" },
            h("div", { class: "selected" },
                h("span", { class: "material-symbols-outlined" }, "kid_star"),
                "Welcome")),
        h("article", null, use(this.state.screen))));
    async open(args = []) {
        const win = anura.wm.create(this, {
            title: "Explore RainbowOS",
            width: `calc(${window.innerHeight * 0.6}px * 16 / 10)`,
            height: `${window.innerHeight * 0.6}px`,
        });
        win.content.style.backgroundColor = "var(--theme-bg)";
        win.content.style.color = "var(--theme-fg)";
        win.content.style.height = "calc(100% - 24px)"; // very dirty hack
        win.content.appendChild(await this.page());
        return win;
    }
}
//# sourceMappingURL=ExploreApp.js.map