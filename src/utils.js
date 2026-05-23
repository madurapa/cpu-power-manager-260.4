/*
 *
 *  CPUPower for GNOME Shell preferences
 *  - Creates a widget to set the preferences of the cpupower extension
 *
 * Copyright (C) 2017
 *     Martin Koppehel <martin.koppehel@st.ovgu.de>,
 *     Fin Christensen <christensen.fin@gmail.com>,
 *
 * This file is part of the gnome-shell extension cpupower.
 *
 * gnome-shell extension cpupower is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * gnome-shell extension cpupower is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell extension cpupower.  If not, see
 * <http://www.gnu.org/licenses/>.
 *
 */

import Gio from "gi://Gio";
import GLib from "gi://GLib";

import * as CONFIG from "./config.js";
import {getExtensionPath} from "./extensionContext.js";

const PKEXEC = GLib.find_program_in_path("pkexec");

function installerPath() {
    return `${getExtensionPath()}/tool/installer.sh`;
}

// FIXME: I don't know how to call linux's getuid directly...
export function getuid() {
    const [, stdout] = GLib.spawn_sync(null, ["id", "-u"], null, GLib.SpawnFlags.SEARCH_PATH, null);
    return parseInt(new TextDecoder().decode(stdout));
}

function spawnProcessCheckExitCode(argv, callback) {
    if (argv.some((arg) => arg === null || arg === undefined)) {
        if (callback) {
            callback(false);
        }
        return;
    }

    let [ok, pid] = GLib.spawn_async(
        getExtensionPath(),
        argv,
        null,
        GLib.SpawnFlags.DO_NOT_REAP_CHILD,
        null,
    );
    if (!ok) {
        if (callback) {
            callback(false);
        }
        return;
    }
    GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (process, exitStatus) => {
        GLib.spawn_close_pid(process);
        let exitCode = 0;
        try {
            GLib.spawn_check_exit_status(exitStatus);
        } catch (e) {
            exitCode = e.code;
        }

        if (callback) {
            callback(exitCode === 0, exitCode);
        }
    });
}

export const INSTALLER_SUCCESS = 0;
export const INSTALLER_INVALID_ARG = 1;
export const INSTALLER_FAILED = 2;
export const INSTALLER_NEEDS_UPDATE = 3;
export const INSTALLER_NEEDS_SECURITY_UPDATE = 4;
export const INSTALLER_NOT_INSTALLED = 5;
export const INSTALLER_MUST_BE_ROOT = 6;

export function checkInstalled(callback) {
    spawnProcessCheckExitCode(
        [installerPath(), "--prefix", CONFIG.PREFIX, "--tool-suffix", CONFIG.TOOL_SUFFIX, "check"],
        callback,
    );
}

export function attemptInstallation(done) {
    spawnProcessCheckExitCode(
        [PKEXEC, installerPath(), "--prefix", CONFIG.PREFIX, "--tool-suffix", CONFIG.TOOL_SUFFIX, "install"],
        done,
    );
}

export function attemptUninstallation(done) {
    spawnProcessCheckExitCode(
        [PKEXEC, installerPath(), "--prefix", CONFIG.PREFIX, "--tool-suffix", CONFIG.TOOL_SUFFIX, "uninstall"],
        done,
    );
}

export function attemptUpdate(done) {
    spawnProcessCheckExitCode(
        [PKEXEC, installerPath(), "--prefix", CONFIG.PREFIX, "--tool-suffix", CONFIG.TOOL_SUFFIX, "update"],
        done,
    );
}

export const CPUFREQCTL_SUCCESS = 0;
export const CPUFREQCTL_NO_ARGUMENTS = 3;
export const CPUFREQCTL_INVALID_ARGUMENT = 4;
export const CPUFREQCTL_OUT_OF_RANGE = 5;
export const CPUFREQCTL_NO_BACKEND = 6;
export const CPUFREQCTL_INVALID_BACKEND = 7;
export const CPUFREQCTL_INTERNAL_ERROR = 8;
export const CPUFREQCTL_NOT_SUPPORTED = 9;

function runCpufreqctl(pkexecNeeded, backend, params, cb) {
    let args = [
        CONFIG.CPUFREQCTL,
        "--backend", backend,
        "--format", "json",
    ].concat(params);

    if (pkexecNeeded) {
        if (!PKEXEC) {
            if (cb) {
                cb({
                    ok: false,
                    exitCode: null,
                    response: null,
                });
            }
            return;
        }

        args.unshift(PKEXEC);
    }

    let launcher = Gio.SubprocessLauncher.new(Gio.SubprocessFlags.STDOUT_PIPE);
    launcher.set_cwd(getExtensionPath());
    let proc;
    try {
        proc = launcher.spawnv(args);
    } catch (e) {
        if (cb) {
            cb({
                ok: false,
                exitCode: null,
                response: null,
            });
        }
        return;
    }

    proc.communicate_utf8_async(null, null, (proc, result) => {
        let ok;
        let stdout;
        try {
            [ok, stdout] = proc.communicate_utf8_finish(result);
        } catch (e) {
            if (cb) {
                cb({
                    ok: false,
                    exitCode: null,
                    response: null,
                });
            }
            return;
        }

        let exitCode = proc.get_exit_status();
        stdout = stdout || "";

        let response;
        if (exitCode === CPUFREQCTL_SUCCESS) {
            if (stdout.trim() === "") {
                response = null;
            } else {
                try {
                    response = JSON.parse(stdout.trim());
                } catch (e) {
                    console.error(e);
                    console.log(stdout);
                }
            }
        } else {
            response = stdout;
        }

        if (cb) {
            cb({
                ok: exitCode === 0,
                exitCode,
                response,
            });
        }
    });
}

export const Cpufreqctl = {
    turbo: {
        get(backend, cb) {
            runCpufreqctl(false, backend, ["turbo", "get"], cb);
        },
        set(backend, value, cb) {
            runCpufreqctl(true, backend, ["turbo", "set", value], cb);
        },
    },
    min: {
        get(backend, cb) {
            runCpufreqctl(false, backend, ["min", "get"], cb);
        },
        set(backend, value, cb) {
            runCpufreqctl(true, backend, ["min", "set", value], cb);
        },
    },
    max: {
        get(backend, cb) {
            runCpufreqctl(false, backend, ["max", "get"], cb);
        },
        set(backend, value, cb) {
            runCpufreqctl(true, backend, ["max", "set", value], cb);
        },
    },
    reset(backend, cb) {
        runCpufreqctl(true, backend, ["reset"], cb);
    },
    info: {
        frequencies(backend, cb) {
            runCpufreqctl(true, backend, ["info", "frequencies"], cb);
        },
        current(backend, cb) {
            runCpufreqctl(false, backend, ["info", "current"], cb);
        },
    },
    backends: {
        list(backend, cb) {
            runCpufreqctl(false, backend, ["backends", "list"], cb);
        },
        current(backend, cb) {
            runCpufreqctl(false, backend, ["backends", "current"], cb);
        },
        automatic(cb) {
            runCpufreqctl(false, "automatic", ["backends", "current"], cb);
        },
    },
    exitCodeToString(exitCode) {
        switch (exitCode) {
        case CPUFREQCTL_SUCCESS:
            return "SUCCESS";
        case CPUFREQCTL_NO_ARGUMENTS:
            return "NO_ARGUMENTS";
        case CPUFREQCTL_INVALID_ARGUMENT:
            return "INVALID_ARGUMENT";
        case CPUFREQCTL_OUT_OF_RANGE:
            return "OUT_OF_RANGE";
        case CPUFREQCTL_NO_BACKEND:
            return "NO_BACKEND";
        case CPUFREQCTL_INVALID_BACKEND:
            return "INVALID_BACKEND";
        case CPUFREQCTL_INTERNAL_ERROR:
            return "INTERNAL_ERROR";
        case CPUFREQCTL_NOT_SUPPORTED:
            return "NOT_SUPPORTED";
        default:
            return "UNKNOWN";
        }
    },
};
