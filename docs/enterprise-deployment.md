# Enterprise Deployment

Guidance for deploying Snacka Desktop in enterprise environments (Active
Directory, SCCM/MECM, Intune, Group Policy).

## Installer choice

Two Windows installers are published for each release:

| Installer | File | Scope | Use case |
|-----------|------|-------|----------|
| **MSI** | `snacka-<version>-win-<arch>.msi` | Per-machine by default | SCCM/MECM, Intune, GPO, any SYSTEM-context deployment |
| **NSIS** | `snacka-<version>-win-<arch>.exe` | Per-user by default | Interactive install by end users |

**Use the MSI for enterprise deployment.** The NSIS installer is not designed
for SYSTEM-context execution (e.g., SCCM running as `NT AUTHORITY\SYSTEM`) —
its per-user/per-machine detection relies on user context that is not
available when running as SYSTEM.

## Standard deployment command

```cmd
msiexec /i snacka-<version>-win-x64.msi /qn
```

This performs a silent, per-machine install into `%ProgramFiles%\Snacka`.

## Public MSI properties

The MSI exposes the following public properties that enterprise administrators
can pass on the `msiexec` command line.

### `DISABLE_AUTO_UPDATES`

Disables the in-app auto-update mechanism by writing
`resources/update.json` with `{"canUpdate": false, "autoUpdate": false}`
during installation.

```cmd
msiexec /i snacka-<version>-win-x64.msi DISABLE_AUTO_UPDATES=1 /qn
```

Use this when auto-updates are managed centrally (via SCCM, Intune, or any
software distribution system) and the client should not check for or install
updates on its own.

The property is applied during install. On uninstall, `update.json` is removed
together with the rest of the installation directory.

### `SET_DEFAULT_ASSOCIATIONS`

Makes Snacka the default `tel:` / `callto:` handler on
unmanaged machines by writing the GPO-equivalent policy registry
value at install time.

```cmd
msiexec /i snacka-<version>-win-x64.msi SET_DEFAULT_ASSOCIATIONS=1 /qn
```

Full details — including the bundled XML, GPO / Intune / DISM
alternatives, precedence rules, and client-side verification — live in
[`windows-default-app-associations.md`](./windows-default-app-associations.md).

`SET_DEFAULT_ASSOCIATIONS` only wires Windows protocol defaults for
`tel:`/`callto:`. It does not enable Snacka telephony by itself;
admins must still enable telephony via overridden Snacka settings.

## SCCM / MECM deployment

The MSI runs correctly under `NT AUTHORITY\SYSTEM`. Typical deployment
program command line:

```cmd
msiexec /i "snacka-<version>-win-x64.msi" DISABLE_AUTO_UPDATES=1 /qn /norestart
```

Detection method: file presence at `%ProgramFiles%\Snacka\Snacka.exe`, or
the MSI product code.

Package identifiers (verified from `snacka-4.16.0-win-x64.msi`):

| Property | Value | Stability |
|----------|-------|-----------|
| `ProductName` | `Snacka` | Stable |
| `Manufacturer` | `Trafikverket Team Snacka` | Stable |
| `UpgradeCode` | `{9133B418-ACFE-555E-A55E-358103620127}` | Stable as long as `appId` (`se.trafikverket.snacka`) is unchanged |
| `ProductCode` | Regenerated per version | **Changes every release** — do not hard-code |

Use `UpgradeCode` for supersedence rules; use file version detection for
per-version targeting. `ALLUSERS=1` is already baked into the package, so it
does not need to be passed on the command line.

## Handover to IKTii - IT-arbetsplats

Publishing a GitHub release is not the end of the release chain. The MSI is
handed over to the grouping **IKTii - IT-arbetsplats**, who own the
Trafikverket-internal distribution:

1. Team Snacka publishes the release and hands the MSI to IKTii - IT-arbetsplats.
2. IKTii - IT-arbetsplats packages it and makes it available in **SCCM** for
   distribution to existing clients.
3. The version becomes the current one for new orders in the internal ordering
   system **Butler**.

Point them at this document for the deployment command, the public MSI
properties, and the detection identifiers above.

Send the architecture the fleet actually runs — `snacka-<version>-win-x64.msi`
in the general case. `ia32` and `arm64` packages are published for every
release if they are needed.

> **Status:** during the initial phase this handover has been done manually,
> case by case. It is intended to follow the established routines for
> application delivery going forward. Until that routine is in place, treat the
> handover as a manual step that has to be triggered explicitly for each
> release — a published GitHub release does **not** by itself reach any client
> machine.

## Troubleshooting

### Generate a verbose install log

Add `/l*v install.log` to capture a full MSI log (useful if a custom action
or property is not applying as expected):

```cmd
msiexec /i snacka-<version>-win-x64.msi DISABLE_AUTO_UPDATES=1 /qn /l*v install.log
```

Search the log for `DISABLE_AUTO_UPDATES`, `WriteUpdateJson`, and
`CustomActionData` to verify the custom action executed.

### Verify auto-updates are disabled

After install, check that `update.json` exists in the resources folder:

```cmd
type "%ProgramFiles%\Snacka\resources\update.json"
```

It should contain:

```json
{
  "canUpdate": false,
  "autoUpdate": false
}
```

## Default app associations (tel:/callto:)

Windows blocks programmatic per-user default-handler registration, so
making Snacka the default for `tel:` and `callto:` requires a
policy-channel rollout (GPO, Intune, DISM) or the
`SET_DEFAULT_ASSOCIATIONS=1` MSI flag above for unmanaged machines.

After deployment, users or support staff can verify the effective
handler in **Settings → Voice & Video → Telephony → Diagnostics**.
The diagnostics distinguish between install registration problems and
per-user default-app choices; when the user choice is missing or points
to another app, the affected row includes an action to open Windows
Default Apps.

See [`windows-default-app-associations.md`](./windows-default-app-associations.md)
for the bundled XML, every supported channel, precedence rules, and
verification steps.
