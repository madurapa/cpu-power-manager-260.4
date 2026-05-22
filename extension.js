/*
 *
 *  CPUPower for GNOME Shell preferences
 *  - Creates a widget to set the preferences of the cpupower extension
 *
 * Copyright (C) 2015
 *     Martin Koppehel <martin.koppehel@st.ovgu.de>
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

import {Extension} from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import * as CONFIG from "./src/config.js";
import * as utils from "./src/utils.js";
import {CPUFreqIndicator} from "./src/indicator.js";
import {NotInstalledIndicator} from "./src/notinstalled.js";
import {SECURITY_UPDATE, UPDATE, UpdateIndicator} from "./src/update.js";
import {clearExtensionContext, setExtensionContext} from "./src/extensionContext.js";

const DBUS_INTERFACE = "schemas/io.github.martin31821.cpupower.dbus.xml";

function readTextFile(path) {
    const [, contents] = GLib.file_get_contents(path);
    return new TextDecoder().decode(contents);
}

export default class CPUPowerExtension extends Extension {
    enable() {
        setExtensionContext(this);
        CONFIG.refresh();

        this._enabled = true;
        this._indicatorInstance = null;
        this._cpupowerProxy = null;
        this._extensionReloadSignalHandler = null;

        const extensionPath = this.path || this.dir.get_path();
        const interfaceXml = readTextFile(`${extensionPath}/${DBUS_INTERFACE}`);
        const CpupowerProxy = Gio.DBusProxy.makeProxyWrapper(interfaceXml);

        this._cpupowerProxy = new CpupowerProxy(
            Gio.DBus.session,
            "io.github.martin31821.cpupower",
            "/io/github/martin31821/cpupower",
        );

        this._extensionReloadSignalHandler = this._cpupowerProxy.connectSignal(
            "ExtensionReloadRequired",
            () => {
                console.log("Reloading cpupower");
                this.disable();
                this.enable();
            },
        );

        try {
            utils.checkInstalled((installed, exitCode) => {
                if (!this._enabled) {
                    return;
                }

                if (!installed) {
                    switch (exitCode) {
                    case utils.INSTALLER_NEEDS_UPDATE:
                        this._indicatorInstance = new UpdateIndicator(
                            UPDATE,
                            this._reenableAfterSuccess.bind(this),
                            this._enableIndicator.bind(this),
                        );
                        break;
                    case utils.INSTALLER_NEEDS_SECURITY_UPDATE:
                        this._indicatorInstance = new UpdateIndicator(
                            SECURITY_UPDATE,
                            this._reenableAfterSuccess.bind(this),
                            this._enableIndicator.bind(this),
                        );
                        break;
                    default:
                        this._indicatorInstance = new NotInstalledIndicator(
                            exitCode,
                            this._reenableAfterSuccess.bind(this),
                            this._enableIndicator.bind(this),
                        );
                        break;
                    }
                } else {
                    this._indicatorInstance = new CPUFreqIndicator(this._enableIndicator.bind(this));
                }
            });
        } catch (e) {
            console.error(e);
        }
    }

    _enableIndicator(instance) {
        if (!this._enabled) {
            instance.destroy();
            return;
        }

        Main.panel.addToStatusArea("cpupower", instance.mainButton);
        instance.enable();
    }

    _reenableAfterSuccess(success) {
        if (success) {
            this.disable();
            this.enable();
        }
    }

    disable() {
        this._enabled = false;

        if (this._indicatorInstance) {
            this._indicatorInstance.disable();
            this._indicatorInstance.destroy();
            this._indicatorInstance = null;
        }

        if (this._cpupowerProxy && this._extensionReloadSignalHandler) {
            this._cpupowerProxy.disconnectSignal(this._extensionReloadSignalHandler);
            this._cpupowerProxy = null;
            this._extensionReloadSignalHandler = null;
        }

        clearExtensionContext(this);
    }
}
