let extension = null;

export function setExtensionContext(value) {
    extension = value;
}

export function clearExtensionContext(value = null) {
    if (value === null || extension === value) {
        extension = null;
    }
}

export function getExtension() {
    if (!extension) {
        throw new Error("cpupower extension context is not initialized");
    }

    return extension;
}

export function getExtensionPath() {
    const currentExtension = getExtension();

    if (currentExtension.path) {
        return currentExtension.path;
    }

    if (currentExtension.dir) {
        return currentExtension.dir.get_path();
    }

    throw new Error("cpupower extension path is not available");
}

export function getSettings(schema) {
    return getExtension().getSettings(schema);
}
