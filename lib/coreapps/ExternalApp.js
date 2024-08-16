"use strict";
class ExternalApp extends App {
    manifest;
    source;
    icon = "/assets/icons/generic.png";
    constructor(manifest, source) {
        super();
        this.manifest = manifest;
        this.name = manifest.name;
        if (manifest.icon) {
            this.icon = source + "/" + manifest.icon;
        }
        this.source = source;
        this.package = manifest.package;
        this.hidden = manifest.hidden || false;
    }
    static serializeArgs(args) {
        const encoder = new TextEncoder();
        const encodedValues = args.map((value) => {
            const bytes = encoder.encode(value);
            const binString = String.fromCodePoint(...bytes);
            return btoa(binString);
        });
        return encodeURIComponent(encodedValues.join(","));
    }
    static deserializeArgs(args) {
        const decoder = new TextDecoder("utf-8");
        return decodeURIComponent(args)
            .split(",")
            .map((value) => {
            const binString = atob(value);
            return decoder.decode(Uint8Array.from(binString, (c) => c.charCodeAt(0)));
        });
    }
    //@ts-expect-error manual apps exist
    async open(args = []) {
        //  TODO: have a "allowmultiinstance" option in manifest? it might confuse users, some windows open a second, some focus
        // if (this.windowinstance) return;
        if (this.manifest.type === "auto") {
            const win = anura.wm.create(this, this.manifest.wininfo);
            const iframe = document.createElement("iframe");
            // CSS injection here but it's no big deal
            const bg = this.manifest.background || "var(--theme-bg)";
            iframe.setAttribute("style", "top:0; left:0; bottom:0; right:0; width:100%; height:100%; " +
                `border: none; margin: 0; padding: 0; background-color: ${bg};`);
            console.log(this.source);
            iframe.setAttribute("src", `${this.source}/${this.manifest.index}${this.manifest.index?.includes("?") ? "&" : "?"}args=${ExternalApp.serializeArgs(args)}`);
            win.content.appendChild(iframe);
            Object.assign(iframe.contentWindow, {
                anura,
                AliceWM,
                ExternalApp,
                LocalFS,
                instance: this,
                instanceWindow: win,
                open: async (url) => {
                    const browser = await anura.import("anura.libbrowser");
                    browser.openTab(url);
                },
            });
            const matter = document.createElement("link");
            matter.setAttribute("rel", "stylesheet");
            matter.setAttribute("href", "/assets/matter.css");
            iframe.contentWindow.addEventListener("load", () => {
                iframe.contentDocument.head.appendChild(matter);
            });
            iframe.setAttribute('is', 'x-iframe-bypass');
            return win;
        }
        else if (this.manifest.type === "manual") {
            // This type of application is reserved only for scripts meant for hacking anura internals
            const req = await fetch(`${this.source}/${this.manifest.handler}`);
            const data = await req.text();
            top.window.eval(data);
            // @ts-ignore
            loadingScript(this.source, this);
            taskbar.updateTaskbar();
            alttab.update();
            return;
        }
        else if (this.manifest.type === "webview") {
            // FOR INTERNAL USE ONLY
            const win = anura.wm.create(this, this.manifest.wininfo);
            const iframe = document.createElement("iframe");
            // CSS injection here but it's no big deal
            const bg = this.manifest.background || "var(--theme-bg)";
            iframe.setAttribute("style", "top:0; left:0; bottom:0; right:0; width:100%; height:100%; " +
                `border: none; margin: 0; padding: 0; background-color: ${bg};`);
            console.log(this.source);
            let encoded = "";
            for (let i = 0; i < this.manifest.src.length; i++) {
                if (i % 2 == 0) {
                    encoded += this.manifest.src[i];
                }
                else {
                    encoded += String.fromCharCode(this.manifest.src.charCodeAt(i) ^ 2);
                }
            }
            iframe.setAttribute("src", `${"/service/" + encodeURIComponent(encoded)}`);
            iframe.setAttribute('is', 'x-iframe-bypass');
            win.content.appendChild(iframe);
            return win;
        }
    }
}
//# sourceMappingURL=ExternalApp.js.map