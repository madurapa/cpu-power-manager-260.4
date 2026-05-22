#! /usr/bin/env -S gjs -m

import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk?version=3.0";

import * as CONFIG from "../config.js";
import * as Convenience from "../convenience.js";
import {setExtensionContext} from "../extensionContext.js";

const scriptdir = Gio.File.new_for_uri(import.meta.url).get_parent();
const extensionDir = scriptdir.get_parent().get_parent();
const extensionPath = extensionDir.get_path();

const metadata = {
    uuid: "cpupower@mko-sl.de",
    localedir: "/usr/local/share/locale",
    "settings-schema": "org.gnome.shell.extensions.cpupower",
    "gettext-domain": "gnome-shell-extension-cpupower",
};

function getSettings(schema) {
    schema = schema || metadata["settings-schema"];

    const schemaDir = extensionDir.get_child("schemas");
    const schemaSource = schemaDir.query_exists(null)
        ? Gio.SettingsSchemaSource.new_from_directory(
            schemaDir.get_path(),
            Gio.SettingsSchemaSource.get_default(),
            false,
        )
        : Gio.SettingsSchemaSource.get_default();
    const schemaObj = schemaSource.lookup(schema, true);

    if (!schemaObj) {
        throw new Error(`Schema ${schema} could not be found for extension ${metadata.uuid}.`);
    }

    return new Gio.Settings({settings_schema: schemaObj});
}

setExtensionContext({
    metadata,
    path: extensionPath,
    dir: extensionDir,
    getSettings,
});
CONFIG.refresh();
Convenience.initTranslations("gnome-shell-extension-cpupower");
const {CPUPowerPreferences} = await import("../preferences.js");

Gtk.init(null);

let win = new Gtk.Window();
win.connect("delete-event", () => {
    Gtk.main_quit();
});
let headerbar = new Gtk.HeaderBar();
headerbar.set_show_close_button(true);
headerbar.title = "CPU Power Manager";
win.set_titlebar(headerbar);
let preferences = new CPUPowerPreferences();
let mainWidget = preferences.show();
win.add(mainWidget);
win.show_all();

Gtk.main();
