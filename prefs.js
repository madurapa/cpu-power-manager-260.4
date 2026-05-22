/*
 *
 *  CPUPower for GNOME Shell preferences
 *  - Creates a widget to set the preferences of the cpupower extension
 *
 * Copyright (C) 2015
 *     Martin Koppehel <psl.kontakt@gmail.com>,
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

import Adw from "gi://Adw";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

import {ExtensionPreferences, gettext as _} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

function getExtensionPath(extension) {
    return extension.path || extension.dir.get_path();
}

export default class CPUPowerPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_default_size(520, 180);

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: _("CPU Power Manager"),
            description: _("The existing preferences UI uses GTK3 and opens in a separate window."),
        });

        const row = new Adw.ActionRow({
            title: _("Open Preferences"),
            subtitle: _("Launch the CPU Power Manager preferences window"),
        });
        const button = new Gtk.Button({label: _("Open")});
        button.connect("clicked", () => this._launchStandalonePreferences());
        row.add_suffix(button);
        row.activatable_widget = button;

        group.add(row);
        page.add(group);
        window.add(page);

        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._launchStandalonePreferences();
            return GLib.SOURCE_REMOVE;
        });
    }

    _launchStandalonePreferences() {
        try {
            GLib.spawn_async(
                null,
                ["gjs", "-m", `${getExtensionPath(this)}/src/prefs40/main.js`],
                null,
                GLib.SpawnFlags.SEARCH_PATH,
                null,
            );
        } catch (e) {
            console.error(e);
        }
    }
}
