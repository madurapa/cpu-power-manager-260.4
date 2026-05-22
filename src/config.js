/*
 *
 *  CPUPower for GNOME Shell preferences
 *  - Creates a widget to set the preferences of the cpupower extension
 *
 * Copyright (C) 2017-2020
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

import GLib from "gi://GLib";

import {getExtensionPath} from "./extensionContext.js";

export const PREFIX = "/usr";
export const LOCALEDIR = "/usr/local/share/locale";

export let TOOL_SUFFIX = "";
export let IS_USER_INSTALL = false;
export let CPUFREQCTL = `${PREFIX}/bin/cpufreqctl`;
export let POLKIT = `${PREFIX}/share/polkit-1/actions/mko.cpupower.setcpufreq.policy`;

export function refresh() {
    TOOL_SUFFIX = "";
    IS_USER_INSTALL = false;
    CPUFREQCTL = `${PREFIX}/bin/cpufreqctl`;
    POLKIT = `${PREFIX}/share/polkit-1/actions/mko.cpupower.setcpufreq.policy`;

    if (getExtensionPath().includes("/home")) {
        // User installs need per-user privileged helper names.
        TOOL_SUFFIX = GLib.get_user_name();
        CPUFREQCTL = `${PREFIX}/local/bin/cpufreqctl-${TOOL_SUFFIX}`;
        POLKIT = `${PREFIX}/share/polkit-1/actions/mko.cpupower.setcpufreq.${TOOL_SUFFIX}.policy`;
        IS_USER_INSTALL = true;
    }
}
