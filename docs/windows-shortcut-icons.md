# Windows Shortcut Icons and Taskbar Pins

## Symptom

After an MSI upgrade, a taskbar pin created against the previous release shows
a blank icon. The Start menu entry looks correct, and clicking the pin still
starts Snacka — only the icon is gone.

Reported after the 4.16.0 rollout. On an affected machine the pin and the
Start menu shortcut carried two different ProductCode GUIDs, and only the
pin's path was gone.

## Why it happens

electron-builder emits both Windows shortcuts as advertised shortcuts whose
icon comes from the MSI Icon table, not from the executable:

```xml
<Shortcut Id="startMenuShortcut" ... Advertise="yes" Icon="SnackaIcon.exe">
```

Windows Installer extracts that icon to a folder named after the ProductCode:

```text
C:\Windows\Installer\{ProductCode}\SnackaIcon.exe
```

and writes that path into the `.lnk` as its `IconLocation`.

The WiX template electron-builder ships uses `<Product Id="*">`, so the
ProductCode is regenerated for every release (documented in
[enterprise-deployment.md](enterprise-deployment.md)). A major upgrade
therefore removes the previous product together with its icon folder.

The Start menu shortcut under `C:\ProgramData\Microsoft\Windows\Start Menu\`
is rewritten by the new installer and picks up the new path, so it survives.
The taskbar pin does not: it is a private copy at

```text
%APPDATA%\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\Snacka.lnk
```

that no installer touches. It keeps pointing at the deleted folder.

Windows 11 Start menu pins are unaffected — they live in `start2.bin` and
resolve through the Start menu shortcut.

The NSIS installer was never affected, because it creates shortcuts directly
against `$INSTDIR\Snacka.exe`.

## The fix

[build/msiProjectCreated.js](../build/msiProjectCreated.js) drops
`Advertise="yes"` and the `Icon` attribute from both shortcuts:

```xml
<Shortcut Id="startMenuShortcut" ... Advertise="no">
```

The `<Shortcut>` elements are nested inside `<File Id="mainExecutable">`, so
WiX derives the shortcut target implicitly from the parent File — the
installed `Snacka.exe`. Without an `Icon` attribute the shell reads the icon
from that same executable, whose path is identical across releases, so pins
made from this version onwards survive future upgrades.

An explicit `Target="[#mainExecutable]"` on a nested `<Shortcut>` is invalid
and fails candle with `CNDL0062`; the parent-File nesting is what makes it
work.

The `<ProgId>` and `<Extension>` elements used for protocol registration keep
their advertised `Icon` attribute; only the two `<Shortcut>` elements change.
The hook throws at build time if electron-builder's shortcut markup stops
matching, so a dependency bump cannot silently reintroduce the problem.

## Repairing pins made before the fix

The dead icon path is baked into the pin's `.lnk`, which the installer never
rewrites. Existing pins need one repair, either by unpinning and pinning again,
or with this script run in user context:

```powershell
$target = (New-Object -COM WScript.Shell).CreateShortcut(
  "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Snacka.lnk").TargetPath

$pin = "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\Snacka.lnk"
if (Test-Path $pin) {
  $l = (New-Object -COM WScript.Shell).CreateShortcut($pin)
  $l.IconLocation = "$target,0"
  $l.Save()
  ie4uinit.exe -show
}
```

It reads the target from the freshly installed Start menu shortcut instead of
hard-coding an installation path, so it works for every architecture and for
installs redirected with `TARGETDIR`.

## Checking a machine

```powershell
$pin = "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\Snacka.lnk"
$l = (New-Object -COM WScript.Shell).CreateShortcut($pin)
$l.IconLocation
Test-Path (($l.IconLocation -split ',')[0])
```

A path under `C:\Windows\Installer\{...}` that fails `Test-Path` is the broken
state. After the fix the icon path points into the installation directory.
