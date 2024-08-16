"use strict";
class ThemeEditor extends App {
    state = $state({
        resizing: false,
    });
    picker;
    css = css `
        input[type="color"] {
            appearance: none;
            background: none;
            padding: 0;
            border: 0;
            border-radius: 100%;
            width: 20px;
            height: 20px;
        }

        input[type="color" i]::-webkit-color-swatch-wrapper {
            padding: 0;
            border: 0;
        }

        input[type="color" i]::-webkit-color-swatch {
            border-radius: 50%;
            padding: 0;
        }

        div > * {
            display: flex;
            align-items: center;

            margin: 10px 0;
        }

        div > input {
            margin: 0 10px;
        }
    `;
    colorEditors = [
        {
            prop: "background",
            name: "Background",
        },
        {
            prop: "secondaryBackground",
            name: "Secondary Background",
        },
        {
            prop: "darkBackground",
            name: "Dark Background",
        },
        {
            prop: "accent",
            name: "Accent",
        },
        {
            prop: "foreground",
            name: "Foreground",
        },
        {
            prop: "secondaryForeground",
            name: "Secondary Foreground",
        },
        {
            prop: "border",
            name: "Border",
        },
        {
            prop: "darkBorder",
            name: "Dark Border",
        },
    ];
    constructor() {
        super();
        this.name = "Theme Editor";
        this.icon = "/assets/icons/themeeditor.png";
        this.package = "anura.ui.themeeditor";
    }
    page = async () => (h("div", { style: {
            padding: "2%",
            height: "100%",
            width: "100%",
            position: "absolute",
            color: use(anura.ui.theme.state.foreground),
            background: use(anura.ui.theme.state.background),
        }, class: `background ${this.css}`, id: "theme-editor" },
        h("h1", null, "Theme Editor"),
        h("div", null,
            this.colorEditors.map((color) => (h("div", null,
                color.name,
                h("input", { type: "color", "bind:value": use(anura.ui.theme.state[color.prop]), "on:input": (e) => {
                        const val = e.target
                            .value;
                        anura.ui.theme[color.prop] = val;
                        anura.settings.set("theme", val, color.prop);
                    } })))),
            h("button", { class: "matter-button-contained", style: {
                    backgroundColor: use(anura.ui.theme.state.accent),
                    color: use(anura.ui.theme.state.foreground),
                }, "on:click": () => {
                    anura.ui.theme.reset();
                    anura.settings.set("theme", anura.ui.theme.state);
                } }, "Reset"),
            h("button", { class: "matter-button-contained", style: {
                    backgroundColor: use(anura.ui.theme.state.accent),
                    color: use(anura.ui.theme.state.foreground),
                }, "on:click": () => {
                    this.exportTheme(JSON.stringify(anura.ui.theme.state));
                } }, "Export"),
            h("button", { class: "matter-button-contained", style: {
                    backgroundColor: use(anura.ui.theme.state.accent),
                    color: use(anura.ui.theme.state.foreground),
                }, "on:click": () => {
                    this.importTheme();
                } }, "Import"))));
    async open(args = []) {
        const win = anura.wm.create(this, {
            title: "",
            width: "910px",
            height: `${(720 * window.innerHeight) / 1080}px`,
        });
        this.picker = await anura.import("anura.filepicker");
        win.content.appendChild(await this.page());
        return win;
    }
    async importTheme() {
        // Here be dragons
        console.log("importing baller ass theme");
        const file = await (await this.picker).selectFile("(json|txt)");
        console.log("got the baller ass theme");
        try {
            const data = await anura.fs.promises.readFile(file);
            Object.assign(anura.ui.theme.state, JSON.parse(data));
            anura.ui.theme.apply();
            await anura.settings.set("theme", anura.ui.theme.state);
        }
        catch (e) {
            anura.notifications.add({
                title: "Theme editor",
                description: `Theme could not be loaded: ${e}`,
                timeout: 5000,
            });
        }
    }
    exportTheme(theme) {
        const filePath = `/theme-${Math.floor(Math.random() * 1e10)}.json`;
        anura.fs.writeFile(filePath, theme);
        anura.notifications.add({
            title: "Theme editor",
            description: `Theme saved to ${filePath}`,
            timeout: 5000,
        });
    }
}
//# sourceMappingURL=ThemeEditor.js.map