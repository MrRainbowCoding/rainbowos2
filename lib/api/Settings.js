"use strict";
class Settings {
    cache = {};
    fs;
    constructor(fs, inital) {
        this.fs = fs;
        this.cache = inital;
        navigator.serviceWorker.ready.then((isReady) => {
            isReady.active.postMessage({
                anura_target: "anura.cache",
                value: this.cache["use-sw-cache"],
            });
            console.log("ANURA-SW: For this boot, cache will be " +
                (this.cache["use-sw-cache"] ? "enabled" : "disabled"));
        });
    }
    static async new(fs, defaultsettings) {
        const initial = defaultsettings;
        if (!initial["i-am-a-true-gangsta"]) {
            initial["i-am-a-true-gangsta"] = false;
        }
        if (!initial["wisp-url"]) {
            let url = "";
            if (location.protocol == "https:") {
                url += "wss://";
            }
            else {
                url += "ws://";
            }
            url += window.location.origin.split("://")[1];
            url += "/";
            initial["wisp-url"] = url;
        }
        if (!initial["bare-url"]) {
            initial["bare-url"] = location.origin + "/bare/";
        }
        if (!initial["relay-url"]) {
            alert("figure this out later");
        }
        if (!initial["wallpaper-fit"]) {
            initial["wallpaper-fit"] = "cover";
        }
        if (!initial["wallpaper-contain-color"]) {
            initial["wallpaper-contain-color"] = "#000000";
        }
        if (!initial["theme"]) {
            initial["theme"] = new Theme();
        }
        if (!initial["user-xapps"]) {
            initial["user-xapps"] = [];
        }
        try {
            const raw = await fs.promises.readFile("/anura_settings.json");
            // This Uint8Array is actuallly a buffer, so JSON.parse can handle it
            Object.assign(initial, JSON.parse(raw));
        }
        catch (e) {
            fs.writeFile("/anura_settings.json", JSON.stringify(initial));
        }
        return new Settings(fs, initial);
    }
    get(prop) {
        return this.cache[prop];
    }
    has(prop) {
        return prop in this.cache;
    }
    async set(prop, val, subprop) {
        if (subprop) {
            this.cache[prop][subprop] = val;
        }
        else {
            this.cache[prop] = val;
        }
        await this.fs.promises.writeFile("/anura_settings.json", JSON.stringify(this.cache));
    }
    async remove(prop, subprop) {
        console.warn("anura.settings.remove() is a debug feature, and should not be used outside of development.");
        if (subprop) {
            delete this.cache[prop][subprop];
        }
        else {
            delete this.cache[prop];
        }
        await this.fs.promises.writeFile("/anura_settings.json", JSON.stringify(this.cache));
    }
}
//# sourceMappingURL=Settings.js.map