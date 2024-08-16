"use strict";
const bare = window.BareMux;
class AnuraBareClient {
    ready = true;
    constructor() { }
    async init() {
        this.ready = true;
    }
    async meta() { }
    async request(remote, method, body, headers, signal) {
        const payload = await anura.net.fetch(remote.href, {
            method,
            headers: headers,
            body,
            redirect: "manual",
        });
        const respheaders = {};
        //@ts-ignore
        if (payload.raw_headers)
            for (const [key, value] of payload.raw_headers) {
                //@ts-ignore
                if (!respheaders[key]) {
                    //@ts-ignore
                    respheaders[key] = [value];
                }
                else {
                    //@ts-ignore
                    respheaders[key].push(value);
                }
            }
        return {
            body: payload.body,
            headers: respheaders,
            status: payload.status,
            statusText: payload.statusText,
        };
    }
    connect(url, origin, protocols, requestHeaders, onopen, onmessage, onclose, onerror) {
        //@ts-ignore
        const socket = new anura.net.WebSocket(url.toString(), protocols, {
            headers: requestHeaders,
        });
        //bare client always expects an arraybuffer for some reason
        socket.binaryType = "arraybuffer";
        socket.onopen = (event) => {
            onopen("");
        };
        socket.onclose = (event) => {
            onclose(event.code, event.reason);
        };
        socket.onerror = (event) => {
            onerror("");
        };
        socket.onmessage = (event) => {
            onmessage(event.data);
        };
        //there's no way to close the websocket in bare-mux?
        return (data) => {
            socket.send(data);
        };
    }
}
navigator.serviceWorker.ready.then((isReady) => {
    bare.registerRemoteListener(isReady.active);
    bare.SetSingletonTransport(new AnuraBareClient());
});
//# sourceMappingURL=bcc.js.map