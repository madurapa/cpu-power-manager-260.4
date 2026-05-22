# CPU Power Manager for Ubuntu 26.04

This repository contains a GNOME Shell 50 port of the CPU Power Manager extension for Ubuntu 26.04.

The extension has two parts:

1. The GNOME Shell extension in this repository.
2. A privileged helper tool named `cpufreqctl`, installed through polkit so CPU frequency limits can actually be changed.

The panel UI can be installed in your home directory, but the helper tool must be installed system-wide because Linux CPU frequency controls require elevated permissions.

## Requirements

- Ubuntu 26.04
- GNOME Shell 50
- `git`
- `gjs`
- `glib-compile-schemas`
- `pkexec` and polkit for helper installation

Check your shell version:

```sh
gnome-shell --version
```

Expected output should be similar to:

```text
GNOME Shell 50.1
```

If `glib-compile-schemas` is missing, install the GLib tools:

```sh
sudo apt install libglib2.0-bin
```

## Install The Extension

The directory name must exactly match the extension UUID: `cpupower@mko-sl.de`.

```sh
mkdir -p ~/.local/share/gnome-shell/extensions
git clone https://github.com/jizongFox/cpu-power-manager-260.4.git ~/.local/share/gnome-shell/extensions/cpupower@mko-sl.de
cd ~/.local/share/gnome-shell/extensions/cpupower@mko-sl.de
```

Compile the local GSettings schema:

```sh
glib-compile-schemas schemas
```

If you installed from a zip file instead of git, make sure the scripts are executable:

```sh
chmod +x tool/installer.sh tool/cpufreqctl src/prefs40/main.js
```

Restart GNOME Shell so it reloads extension metadata.

On Ubuntu's default Wayland session, log out and log back in.

On an Xorg session, you can also press `Alt` + `F2`, type `r`, and press `Enter`.

Enable the extension:

```sh
gnome-extensions enable cpupower@mko-sl.de
```

Check the extension state:

```sh
gnome-extensions info cpupower@mko-sl.de
```

The state should no longer be `OUT OF DATE` after GNOME has reloaded the new metadata.

## Install The Helper Tool

The extension needs the helper tool to apply CPU frequency and turbo boost changes. Without the helper, the extension may load but will show `Installation required` or `Attempt installation`.

For a normal per-user extension installed under `~/.local/share/gnome-shell/extensions`, run:

```sh
cd ~/.local/share/gnome-shell/extensions/cpupower@mko-sl.de
sudo ./tool/installer.sh --prefix /usr --tool-suffix "$USER" install
```

This writes system files outside the extension directory:

- `/usr/local/bin/cpufreqctl-$USER`
- `/usr/share/polkit-1/actions/mko.cpupower.setcpufreq.$USER.policy`
- `/usr/share/polkit-1/rules.d/10-mko.cpupower.setcpufreq.rules`

You can also use the extension menu item `Attempt installation`. That uses `pkexec` and performs the same privileged setup.

After installing the helper, restart the extension:

```sh
gnome-extensions disable cpupower@mko-sl.de
gnome-extensions enable cpupower@mko-sl.de
```

Check the helper installation:

```sh
./tool/installer.sh --prefix /usr --tool-suffix "$USER" check
```

Expected output:

```text
Installed
```

## Open Preferences

Use the panel menu and choose `Preferences`, or run:

```sh
gnome-extensions prefs cpupower@mko-sl.de
```

On GNOME Shell 50, the preferences entry opens a small GTK4 wrapper and launches the existing GTK3 CPU Power Manager preferences window separately.

## Update

From the extension directory:

```sh
git pull
glib-compile-schemas schemas
```

If the extension reports that the helper needs an update, run:

```sh
sudo ./tool/installer.sh --prefix /usr --tool-suffix "$USER" update
```

Then reload the extension:

```sh
gnome-extensions disable cpupower@mko-sl.de
gnome-extensions enable cpupower@mko-sl.de
```

If GNOME still shows old metadata or `OUT OF DATE`, log out and log back in.

## Uninstall

Disable the extension:

```sh
gnome-extensions disable cpupower@mko-sl.de
```

Remove the helper files:

```sh
cd ~/.local/share/gnome-shell/extensions/cpupower@mko-sl.de
sudo ./tool/installer.sh --prefix /usr --tool-suffix "$USER" uninstall
```

Remove the extension directory:

```sh
rm -rf ~/.local/share/gnome-shell/extensions/cpupower@mko-sl.de
```

Log out and log back in after removal.

## Troubleshooting

If the extension is `OUT OF DATE`, confirm that your folder is named `cpupower@mko-sl.de`, run `glib-compile-schemas schemas`, and log out/in so GNOME reloads `metadata.json`.

If settings fail to load, run this from the extension directory:

```sh
GSETTINGS_SCHEMA_DIR=schemas gsettings list-keys org.gnome.shell.extensions.cpupower
```

If the extension says `Installation required`, install the helper with:

```sh
sudo ./tool/installer.sh --prefix /usr --tool-suffix "$USER" install
```

If the extension says the helper needs an update, run:

```sh
sudo ./tool/installer.sh --prefix /usr --tool-suffix "$USER" update
```

If CPU controls do not work after the helper is installed, open Preferences and check the selected backend. The helper supports the `intel_pstate` and `cpufreq` backends. Some newer systems may expose CPU controls differently, and unsupported drivers will be reported by the extension.

If the preferences window does not open, try launching it directly:

```sh
gjs -m ~/.local/share/gnome-shell/extensions/cpupower@mko-sl.de/src/prefs40/main.js
```

To inspect GNOME Shell extension errors, run:

```sh
journalctl --user -f /usr/bin/gnome-shell
```

Then disable and enable the extension in another terminal.

## Notes For System-Wide Installs

The instructions above assume a per-user install under `~/.local/share/gnome-shell/extensions`.

For a system-wide extension install outside `/home`, the helper normally uses no user suffix:

```sh
sudo ./tool/installer.sh --prefix /usr install
```

Use the per-user `--tool-suffix "$USER"` form when the extension lives under your home directory.
