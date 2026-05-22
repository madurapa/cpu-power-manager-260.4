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

import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import St from "gi://St";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import {getExtensionPath, getSettings} from "./extensionContext.js";

const SETTINGS_ID = "org.gnome.shell.extensions.cpupower";

function createArrowIcon() {
    if (PopupMenu.arrowIcon && St.Side?.BOTTOM) {
        return PopupMenu.arrowIcon(St.Side.BOTTOM);
    }

    return new St.Icon({
        icon_name: "pan-down-symbolic",
        style_class: "popup-menu-arrow",
    });
}

export class CPUFreqBaseIndicator {
    constructor() {
        this.mainButton = new PanelMenu.Button(0.0, "cpupower");
        this.menu = this.mainButton.menu;

        this.settings = getSettings(SETTINGS_ID);

        this.hbox = new St.BoxLayout({style_class: "panel-status-menu-box"});
        let gicon = Gio.icon_new_for_string(`${getExtensionPath()}/data/icons/cpu-symbolic.svg`);
        this.icon = new St.Icon({
            gicon,
            style_class: "system-status-icon",
        });

        this.lbl = new St.Label({text: "", y_expand: true, y_align: Clutter.ActorAlign.CENTER});
        this.arrow = createArrowIcon();

        this.createIndicator();

        this._settingsChangedId = this.settings.connect("changed", this.onSettingsChanged.bind(this));
    }

    onSettingsChanged() {
        this.createIndicator();
        this.createMenu();
    }

    createIndicator() {
        this.lblActive = this.settings.get_boolean("show-freq-in-taskbar");
        this.lblUnit = this.settings.get_boolean("taskbar-freq-unit-ghz");
        this.iconActive = this.settings.get_boolean("show-icon-in-taskbar");
        this.arrowActive = this.settings.get_boolean("show-arrow-in-taskbar");
        this.hbox.remove_all_children();
        if (this.iconActive) {
            this.hbox.add_child(this.icon);
        }
        if (this.lblActive) {
            this.hbox.add_child(this.lbl);
        }
        if (this.arrowActive) {
            this.hbox.add_child(this.arrow);
        }
    }

    createMenu() {
        this.menu.removeAll(); // clear the menu in case we are recreating the menu
        this.mainSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this.mainSection);
    }

    disable() {
        if (this.hbox.get_parent()) {
            this.mainButton.remove_child(this.hbox);
        }
    }

    enable() {
        if (!this.hbox.get_parent()) {
            this.mainButton.add_child(this.hbox);
        }
    }

    destroy() {
        if (this._settingsChangedId) {
            this.settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        this.mainButton.destroy();
    }
}
