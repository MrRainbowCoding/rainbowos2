"use strict";
class LocalFSStats {
    name;
    size;
    atime;
    mtime;
    ctime;
    atimeMs;
    mtimeMs;
    ctimeMs;
    node;
    nlinks;
    mode;
    type;
    uid;
    gid;
    dev;
    isFile() {
        return this.type === "FILE";
    }
    isDirectory() {
        return this.type === "DIRECTORY";
    }
    isSymbolicLink() {
        return false;
    }
    constructor(data) {
        this.name = data.name;
        this.size = data.size || 0;
        this.atime = data.atime || new Date();
        this.mtime = data.mtime || new Date();
        this.ctime = data.ctime || new Date();
        this.atimeMs = data.atimeMs || Date.now();
        this.mtimeMs = data.mtimeMs || Date.now();
        this.ctimeMs = data.ctimeMs || Date.now();
        this.node = data.node || crypto.randomUUID();
        this.nlinks = data.nlinks || 1;
        this.mode = data.mode || 0o100777;
        this.type = data.type || "FILE";
        this.uid = data.uid || 0;
        this.gid = data.gid || 0;
        this.dev = data.dev || "localfs";
    }
}
class LocalFS extends AFSProvider {
    dirHandle;
    domain;
    name = "LocalFS";
    version = "1.0.0";
    fds = [];
    cursors = [];
    constructor(dirHandle, domain) {
        super();
        this.dirHandle = dirHandle;
        this.domain = domain;
        this.name += ` (${domain})`;
    }
    relativizePath(path) {
        return path.replace(this.domain, "").replace(/^\/+/, "");
    }
    async getChildDirHandle(path) {
        if (path === "") {
            return this.dirHandle;
        }
        if (path.endsWith("/")) {
            path = path.substring(0, path.length - 1);
        }
        let acc = this.dirHandle;
        for await (const part of path.split("/")) {
            acc = await acc.getDirectoryHandle(part);
        }
        return acc;
    }
    static async new(anuraPath) {
        let dirHandle;
        try {
            dirHandle = await window.showDirectoryPicker({
                id: `anura-${anuraPath.replace(/\/|\s|\./g, "-")}`,
            });
        }
        catch (e) {
            if (e.name !== "TypeError") {
                throw e;
            }
            // The path may not be a valid id, fallback to less specific id
            dirHandle = await window.showDirectoryPicker({
                id: "anura-localfs",
            });
        }
        dirHandle.requestPermission({ mode: "readwrite" });
        try {
            await anura.fs.promises.mkdir(anuraPath);
        }
        catch (e) {
            // Ignore, the directory already exists so we don't need to create it
        }
        const fs = new LocalFS(dirHandle, anuraPath);
        anura.fs.installProvider(fs);
        return fs;
    }
    readdir(path, _options, callback) {
        if (typeof _options === "function") {
            callback = _options;
        }
        callback ||= () => { };
        this.promises
            .readdir(path)
            .then((files) => callback(null, files))
            .catch((e) => callback(e, []));
    }
    stat(path, callback) {
        callback ||= () => { };
        this.promises
            .stat(path)
            .then((stats) => callback(null, stats))
            .catch((e) => callback(e, null));
    }
    readFile(path, callback) {
        callback ||= () => { };
        this.promises
            .readFile(path)
            .then((data) => callback(null, data))
            .catch((e) => callback(e, new Filer.Buffer(0)));
    }
    writeFile(path, data, _options, callback) {
        if (typeof data === "string") {
            data = new TextEncoder().encode(data);
        }
        if (typeof _options === "function") {
            callback = _options;
        }
        callback ||= () => { };
        this.promises
            .writeFile(path, data)
            .then(() => callback(null))
            .catch(callback);
    }
    appendFile(path, data, callback) {
        this.promises
            .appendFile(path, data)
            .then(() => callback(null))
            .catch(callback);
    }
    unlink(path, callback) {
        callback ||= () => { };
        this.promises
            .unlink(path)
            .then(() => callback(null))
            .catch(callback);
    }
    mkdir(path, _mode, callback) {
        if (typeof _mode === "function") {
            callback = _mode;
        }
        callback ||= () => { };
        this.promises
            .mkdir(path)
            .then(() => callback(null))
            .catch(callback);
    }
    rmdir(path, callback) {
        callback ||= () => { };
        this.promises
            .rmdir(path)
            .then(() => callback(null))
            .catch(callback);
    }
    rename(srcPath, dstPath, callback) {
        callback ||= () => { };
        this.promises
            .rename(srcPath, dstPath)
            .then(() => callback(null))
            .catch(callback);
    }
    truncate(path, len, callback) {
        this.promises
            .truncate(path, len)
            .then(() => callback(null))
            .catch(callback);
    }
    /** @deprecated — fs.exists() is an anachronism and exists only for historical reasons. */
    exists(path, callback) {
        this.stat(path, (err, stats) => {
            if (err) {
                callback(false);
                return;
            }
            callback(true);
        });
    }
    promises = {
        writeFile: async (path, data, options) => {
            if (typeof data === "string") {
                data = new TextEncoder().encode(data);
            }
            let parentHandle = this.dirHandle;
            path = this.relativizePath(path);
            if (path.includes("/")) {
                const parts = path.split("/");
                const finalFile = parts.pop();
                parentHandle = await this.getChildDirHandle(parts.join("/"));
                path = finalFile;
            }
            const handle = await parentHandle.getFileHandle(path, {
                create: true,
            });
            const writer = await handle.createWritable();
            writer.write(data);
            writer.close();
        },
        readFile: async (path) => {
            let parentHandle = this.dirHandle;
            path = this.relativizePath(path);
            if (path.includes("/")) {
                const parts = path.split("/");
                const finalFile = parts.pop();
                parentHandle = await this.getChildDirHandle(parts.join("/"));
                path = finalFile;
            }
            const handle = await parentHandle.getFileHandle(path);
            return new Filer.Buffer(await (await handle.getFile()).arrayBuffer());
        },
        readdir: async (path) => {
            const dirHandle = await this.getChildDirHandle(this.relativizePath(path));
            const nodes = [];
            for await (const entry of dirHandle.values()) {
                nodes.push(entry.name);
            }
            return nodes;
        },
        appendFile: async (path, data) => {
            const existingData = await this.promises.readFile(path);
            await this.promises.writeFile(path, new Uint8Array([...existingData, ...data]));
        },
        unlink: async (path) => {
            let parentHandle = this.dirHandle;
            path = this.relativizePath(path);
            if (path.includes("/")) {
                const parts = path.split("/");
                const finalFile = parts.pop();
                parentHandle = await this.getChildDirHandle(parts.join("/"));
                path = finalFile;
            }
            await parentHandle.removeEntry(path);
        },
        mkdir: async (path) => {
            let parentHandle = this.dirHandle;
            path = this.relativizePath(path);
            if (path.includes("/")) {
                const parts = path.split("/");
                const finalDir = parts.pop();
                parentHandle = await this.getChildDirHandle(parts.join("/"));
                path = finalDir;
            }
            await parentHandle.getDirectoryHandle(path, { create: true });
        },
        rmdir: async (path) => {
            let parentHandle = this.dirHandle;
            path = this.relativizePath(path);
            if (path.includes("/")) {
                const parts = path.split("/");
                const finalDir = parts.pop();
                parentHandle = await this.getChildDirHandle(parts.join("/"));
                path = finalDir;
            }
            await parentHandle.removeEntry(path);
        },
        rename: async (oldPath, newPath) => {
            const data = await this.promises.readFile(oldPath);
            await this.promises.writeFile(newPath, data);
            await this.promises.unlink(oldPath);
        },
        stat: async (path) => {
            path = this.relativizePath(path);
            let handle;
            try {
                if (path === "") {
                    handle = await this.dirHandle.getFileHandle(path);
                }
                else {
                    handle = await (await this.getChildDirHandle(path.substring(0, path.lastIndexOf("/")))).getFileHandle(path.substring(path.lastIndexOf("/") + 1));
                }
            }
            catch (e) {
                try {
                    const handle = await this.getChildDirHandle(path);
                    return new LocalFSStats({
                        name: handle.name,
                        mode: 0o40777,
                        type: "DIRECTORY",
                    });
                }
                catch (e) {
                    throw {
                        name: "ENOENT",
                        code: "ENOENT",
                        errno: 34,
                        message: "no such file or directory",
                        path: (this.domain + "/" + path).replace("//", "/"),
                        stack: e,
                    };
                }
            }
            const file = await handle.getFile();
            return new LocalFSStats({
                name: file.name,
                size: file.size,
            });
        },
        truncate: async (path, len) => {
            const data = await this.promises.readFile(path);
            await this.promises.writeFile(path, data.slice(0, len));
        },
        access: () => {
            console.error("Not implemented: access");
            throw new Error("Not implemented");
        },
        chown: () => {
            console.error("Not implemented: chown");
            throw new Error("Not implemented");
        },
        chmod: () => {
            console.error("Not implemented: chmod");
            throw new Error("Not implemented");
        },
        getxattr: () => {
            console.error("Not implemented: getxattr");
            throw new Error("Not implemented");
        },
        link: () => {
            console.error("Not implemented: link");
            throw new Error("Not implemented");
        },
        lstat: (...args) => {
            // @ts-ignore - This is just here for compat with v86
            return this.promises.stat(...args);
        },
        mkdtemp: () => {
            console.error("Not implemented: mkdtemp");
            throw new Error("Not implemented");
        },
        mknod: () => {
            console.error("Not implemented: mknod");
            throw new Error("Not implemented");
        },
        open: async (path, _flags, _mode) => {
            let parentHandle = this.dirHandle;
            if (path.includes("/")) {
                const parts = path.split("/");
                const finalFile = parts.pop();
                parentHandle = await this.getChildDirHandle(parts.join("/"));
                path = finalFile;
            }
            const handle = await parentHandle.getFileHandle(path, {
                create: true,
            });
            this.fds.push(handle);
            return {
                fd: this.fds.length - 1,
                [AnuraFDSymbol]: this.domain,
            };
        },
        readlink: () => {
            console.error("Not implemented: readlink");
            throw new Error("Not implemented");
        },
        removexattr: () => {
            console.error("Not implemented: removexattr");
            throw new Error("Not implemented");
        },
        setxattr: () => {
            console.error("Not implemented: setxattr");
            throw new Error("Not implemented");
        },
        symlink: () => {
            console.error("Not implemented: symlink");
            throw new Error("Not implemented");
        },
        utimes: () => {
            console.error("Not implemented: utimes");
            throw new Error("Not implemented");
        },
    };
    ftruncate() {
        console.error("Not implemented: ftruncate");
        throw new Error("Method not implemented.");
    }
    fstat(fd, callback) {
        callback ||= () => { };
        const handle = this.fds[fd.fd];
        if (handle === undefined) {
            callback({
                name: "EBADF",
                code: "EBADF",
                errno: 9,
                message: "bad file descriptor",
                stack: "Error: bad file descriptor",
            }, null);
            return;
        }
        if (handle.kind === "file") {
            handle.getFile().then((file) => {
                callback(null, new LocalFSStats({ name: file.name, size: file.size }));
            });
        }
        else {
            callback({
                name: "EISDIR",
                code: "EISDIR",
                errno: 21,
                message: "Is a directory",
                stack: "Error: Is a directory",
            }, null);
        }
    }
    lstat(...args) {
        // @ts-ignore - This is just here for compat with v86
        return this.stat(...args);
    }
    link() {
        console.error("Not implemented: link");
        throw new Error("Method not implemented.");
    }
    symlink() {
        console.error("Not implemented: symlink");
        throw new Error("Method not implemented.");
    }
    readlink() {
        console.error("Not implemented: readlink");
        throw new Error("Method not implemented.");
    }
    mknod() {
        console.error("Not implemented: mknod");
        throw new Error("Method not implemented.");
    }
    access() {
        console.error("Not implemented: access");
        throw new Error("Method not implemented.");
    }
    mkdtemp() {
        console.error("Not implemented: mkdtemp");
        throw new Error("Method not implemented.");
    }
    fchown() {
        console.error("Not implemented: fchown");
        throw new Error("Method not implemented.");
    }
    chmod() {
        console.error("Not implemented: chmod");
        throw new Error("Method not implemented.");
    }
    fchmod() {
        console.error("Not implemented: fchmod");
        throw new Error("Method not implemented.");
    }
    fsync() {
        console.error("Not implemented: fsync");
        throw new Error("Method not implemented.");
    }
    write(fd, buffer, offset, length, position, callback) {
        callback ||= () => { };
        const handle = this.fds[fd.fd];
        if (position !== null) {
            position += this.cursors[fd.fd] || 0;
        }
        else {
            position = this.cursors[fd.fd] || 0;
        }
        if (handle === undefined) {
            callback({
                name: "EBADF",
                code: "EBADF",
                errno: 9,
                message: "bad file descriptor",
                stack: "Error: bad file descriptor",
            }, 0);
            return;
        }
        if (handle.kind === "directory") {
            callback({
                name: "EISDIR",
                code: "EISDIR",
                errno: 21,
                message: "Is a directory",
                stack: "Error: Is a directory",
            }, 0);
            return;
        }
        const bufferSlice = buffer.slice(offset, offset + length);
        handle.createWritable().then((writer) => {
            writer.seek(position || 0);
            writer.write(bufferSlice);
            writer.close();
            this.cursors[fd.fd] = (position || 0) + bufferSlice.length;
            callback(null, bufferSlice.length);
        });
    }
    read() {
        console.error("Not implemented: read");
        throw new Error("Method not implemented.");
    }
    setxattr() {
        console.error("Not implemented: setxattr");
        throw new Error("Method not implemented.");
    }
    fsetxattr() {
        console.error("Not implemented: fsetxattr");
        throw new Error("Method not implemented.");
    }
    getxattr() {
        console.error("Not implemented: getxattr");
        throw new Error("Method not implemented.");
    }
    fgetxattr() {
        console.error("Not implemented: fgetxattr");
        throw new Error("Method not implemented.");
    }
    removexattr() {
        console.error("Not implemented: removexattr");
        throw new Error("Method not implemented.");
    }
    fremovexattr() {
        console.error("Not implemented: fremovexattr");
        throw new Error("Method not implemented.");
    }
    utimes() {
        console.error("Not implemented: utimes");
        throw new Error("Method not implemented.");
    }
    futimes() {
        console.error("Not implemented: futimes");
        throw new Error("Method not implemented.");
    }
    chown() {
        console.error("Not implemented: chown");
        throw new Error("Method not implemented.");
    }
    close(fd, callback) {
        callback ||= () => { };
        const handle = this.fds[fd.fd];
        if (handle === undefined) {
            callback({
                name: "EBADF",
                code: "EBADF",
                errno: 9,
                message: "bad file descriptor",
                stack: "Error: bad file descriptor",
            });
            return;
        }
        delete this.fds[fd.fd];
        callback(null);
    }
    open(path, flags, mode, callback) {
        path = this.relativizePath(path);
        if (typeof mode === "function") {
            callback = mode;
        }
        callback ||= () => { };
        this.promises
            .open(path, flags, mode)
            .then((fd) => {
            callback(null, fd);
        })
            .catch((e) => callback(e, { fd: -1, [AnuraFDSymbol]: this.domain }));
    }
}
//# sourceMappingURL=LocalFS.js.map