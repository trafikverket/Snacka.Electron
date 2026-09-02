import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Bridge the build hook (CommonJS) into Jest's TS context.
const buildHook = jest.requireActual<{
  default: (wxsPath: string) => Promise<void>;
}>('../../../build/msiProjectCreated.js');
const hook = buildHook.default;

// Mirrors the shape electron-builder's MsiTarget emits: the main executable
// carries the shortcuts as children, and the protocol ProgId/Extension pair
// shares the same Icon table entry.
const SAMPLE_WXS = `<?xml version="1.0" encoding="UTF-8"?>
<Wix>
  <Product Id="*" Name="Snacka">
    <Icon Id="SnackaIcon.exe" SourceFile="icon.ico"/>
    <Property Id="ARPPRODUCTICON" Value="SnackaIcon.exe"/>
    <ComponentGroup Id="ProductComponents" Directory="APPLICATIONFOLDER">
      <Component>
        <File Name="Snacka.exe" Source="$(var.appDir)\\Snacka.exe" ReadOnly="yes" KeyPath="yes" Id="mainExecutable">
          <Shortcut Id="desktopShortcut" Directory="DesktopFolder" Name="Snacka" WorkingDirectory="APPLICATIONFOLDER" Advertise="yes" Icon="SnackaIcon.exe"/>
          <Shortcut Id="startMenuShortcut" Directory="ProgramMenuFolder" Name="Snacka" WorkingDirectory="APPLICATIONFOLDER" Advertise="yes" Icon="SnackaIcon.exe">
            <ShortcutProperty Key="System.AppUserModel.ID" Value="se.trafikverket.snacka"/>
          </Shortcut>
          <ProgId Id="Snacka.snacka" Advertise="yes" Icon="SnackaIcon.exe">
            <Extension Id="snacka" Advertise="yes"/>
          </ProgId>
        </File>
      </Component>
    </ComponentGroup>
    <InstallExecuteSequence>
      <Custom Action="Existing" After="InstallFiles" />
    </InstallExecuteSequence>
  </Product>
</Wix>`;

const runHook = async (wxs: string): Promise<string> => {
  const dir = mkdtempSync(join(tmpdir(), 'msi-inject-'));
  const file = join(dir, 'test.wxs');
  writeFileSync(file, wxs, 'utf8');
  try {
    await hook(file);
    return readFileSync(file, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe('msiProjectCreated default-associations injection', () => {
  let workDir: string;
  let wxsPath: string;
  let injected: string;

  beforeAll(async () => {
    workDir = mkdtempSync(join(tmpdir(), 'msi-inject-'));
    wxsPath = join(workDir, 'test.wxs');
    writeFileSync(wxsPath, SAMPLE_WXS, 'utf8');
    await hook(wxsPath);
    injected = readFileSync(wxsPath, 'utf8');
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('declares SET_DEFAULT_ASSOCIATIONS as a secure public property', () => {
    expect(injected).toContain(
      '<Property Id="SET_DEFAULT_ASSOCIATIONS" Secure="yes"/>'
    );
  });

  it('points the install CA at the GPO-equivalent policy key', () => {
    expect(injected).toContain(
      'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\\DefaultAssociationsConfiguration'
    );
  });

  it('writes a sentinel under Snacka\\InstallState so uninstall knows what it owns', () => {
    expect(injected).toContain(
      'HKLM\\SOFTWARE\\Snacka\\InstallState\\WroteDefaultAssociationsPolicy'
    );
  });

  it('points the install CA at the bundled XML under resources\\', () => {
    expect(injected).toContain('resources\\SnackaDefaultAppAssociations.xml');
  });

  it('renders single backslashes in VBScript registry paths (no double-escape regression)', () => {
    // After JS template literal expansion the .wxs MUST contain single
    // backslashes that VBScript will parse as literal path separators.
    // A double-backslash would mean we mistakenly escaped twice.
    expect(injected).not.toContain('HKLM\\\\SOFTWARE');
    expect(injected).not.toContain('resources\\\\Snacka');
  });

  it('schedules the install pair conditioned on the property + clean install', () => {
    expect(injected).toMatch(
      /<Custom Action="SetWriteDefaultAssociationsPolicyData"[^>]*>SET_DEFAULT_ASSOCIATIONS = "1" AND NOT Installed AND NOT REMOVE~="ALL"<\/Custom>/
    );
    expect(injected).toMatch(
      /<Custom Action="WriteDefaultAssociationsPolicy"[^>]*>SET_DEFAULT_ASSOCIATIONS = "1" AND NOT Installed AND NOT REMOVE~="ALL"<\/Custom>/
    );
  });

  it('schedules the uninstall pair to skip major-upgrade RemoveExistingProducts', () => {
    expect(injected).toMatch(
      /<Custom Action="SetCleanupDefaultAssociationsPolicyData"[^>]*>REMOVE~="ALL" AND UPGRADINGPRODUCTCODE=""<\/Custom>/
    );
    expect(injected).toMatch(
      /<Custom Action="CleanupDefaultAssociationsPolicy"[^>]*>REMOVE~="ALL" AND UPGRADINGPRODUCTCODE=""<\/Custom>/
    );
  });

  it('puts CustomAction + Property definitions as direct children of <Product>, not inside InstallExecuteSequence', () => {
    const productInner = injected.match(/<Product[^>]*>([\s\S]*)<\/Product>/);
    expect(productInner).not.toBeNull();
    const productBody = productInner![1];

    const seqMatch = productBody.match(
      /<InstallExecuteSequence>([\s\S]*?)<\/InstallExecuteSequence>/
    );
    expect(seqMatch).not.toBeNull();
    const seqBody = seqMatch![1];

    expect(seqBody).not.toContain('<CustomAction');
    expect(seqBody).not.toContain('<Property ');
    expect(productBody).toContain(
      '<CustomAction Id="WriteDefaultAssociationsPolicy"'
    );
    expect(productBody).toContain('<Property Id="SET_DEFAULT_ASSOCIATIONS"');
  });

  it('marks deferred CAs Execute="deferred" + Impersonate="no" so HKLM writes succeed', () => {
    expect(injected).toMatch(
      /Id="WriteDefaultAssociationsPolicy"[\s\S]{0,500}Execute="deferred"[\s\S]{0,500}Impersonate="no"/
    );
    expect(injected).toMatch(
      /Id="CleanupDefaultAssociationsPolicy"[\s\S]{0,500}Execute="deferred"[\s\S]{0,500}Impersonate="no"/
    );
  });

  it('uses Property="<deferred-CA-Id>" type-51 setter to populate CustomActionData', () => {
    expect(injected).toMatch(
      /<CustomAction Id="SetWriteDefaultAssociationsPolicyData"[^>]*Property="WriteDefaultAssociationsPolicy"/
    );
    expect(injected).toMatch(
      /<CustomAction Id="SetCleanupDefaultAssociationsPolicyData"[^>]*Property="CleanupDefaultAssociationsPolicy"/
    );
  });

  it('preserves the pre-existing DISABLE_AUTO_UPDATES injection', () => {
    expect(injected).toContain('DISABLE_AUTO_UPDATES');
    expect(injected).toContain('WriteUpdateJson');
  });

  it('registers telephony capabilities/ProgIds and RegisteredApplications for MSI installs', () => {
    expect(injected).toContain('WriteTelephonyCapabilities');
    expect(injected).toContain(
      'HKLM\\SOFTWARE\\RegisteredApplications\\Snacka'
    );
    expect(injected).toContain(
      'HKLM\\SOFTWARE\\Snacka\\Capabilities\\URLAssociations\\tel'
    );
    expect(injected).toContain(
      'HKLM\\SOFTWARE\\Snacka\\Capabilities\\URLAssociations\\callto'
    );
    expect(injected).toContain('HKLM\\SOFTWARE\\Classes\\Snacka.tel');
    expect(injected).toContain('HKLM\\SOFTWARE\\Classes\\Snacka.callto');
  });

  it('schedules telephony registration independent of SET_DEFAULT_ASSOCIATIONS', () => {
    expect(injected).toMatch(
      /<Custom Action="SetWriteTelephonyCapabilitiesData"[^>]*>NOT REMOVE~="ALL"<\/Custom>/
    );
    expect(injected).toMatch(
      /<Custom Action="WriteTelephonyCapabilities"[^>]*>NOT REMOVE~="ALL"<\/Custom>/
    );
  });

  it('schedules telephony cleanup to skip major-upgrade RemoveExistingProducts', () => {
    expect(injected).toMatch(
      /<Custom Action="SetCleanupTelephonyCapabilitiesData"[^>]*>REMOVE~="ALL" AND UPGRADINGPRODUCTCODE=""<\/Custom>/
    );
    expect(injected).toMatch(
      /<Custom Action="CleanupTelephonyCapabilities"[^>]*>REMOVE~="ALL" AND UPGRADINGPRODUCTCODE=""<\/Custom>/
    );
  });
});

describe('msiProjectCreated shortcut icon rewrite', () => {
  let injected: string;

  beforeAll(async () => {
    injected = await runHook(SAMPLE_WXS);
  });

  it('makes the desktop and Start menu shortcuts non-advertised', () => {
    expect(injected).not.toMatch(
      /<Shortcut Id="(?:desktopShortcut|startMenuShortcut)"[^>]*Advertise="yes"/
    );
    expect(injected).toMatch(
      /<Shortcut Id="desktopShortcut"[^>]*Advertise="no"/
    );
    expect(injected).toMatch(
      /<Shortcut Id="startMenuShortcut"[^>]*Advertise="no"/
    );
  });

  it('drops the Icon table reference so the icon path is not ProductCode-scoped', () => {
    // The Icon table copy lands in C:\Windows\Installer\{ProductCode}\, which a
    // major upgrade deletes — taskbar pins made against the old release then
    // render without an icon.
    expect(injected).not.toMatch(/<Shortcut [^>]*Icon="SnackaIcon.exe"/);
  });

  it('leaves the shortcut target implicit so candle CNDL0062 is not triggered', () => {
    // The <Shortcut> is nested inside <File Id="mainExecutable">, which WiX
    // treats as the implicit shortcut target. An explicit Target attribute on
    // a nested shortcut fails candle with CNDL0062, so the rewrite must not
    // add one.
    expect(injected).not.toMatch(/<Shortcut [^>]*\bTarget=/);
  });

  it('keeps the AppUserModel.ID on the Start menu shortcut', () => {
    expect(injected).toContain(
      '<ShortcutProperty Key="System.AppUserModel.ID" Value="se.trafikverket.snacka"/>'
    );
  });

  it('leaves the protocol ProgId and Extension advertised', () => {
    expect(injected).toContain(
      '<ProgId Id="Snacka.snacka" Advertise="yes" Icon="SnackaIcon.exe">'
    );
    expect(injected).toContain('<Extension Id="snacka" Advertise="yes"/>');
  });

  it('fails the build when the main executable file id is gone', async () => {
    const withoutMainExe = SAMPLE_WXS.replace(' Id="mainExecutable"', '');
    await expect(runHook(withoutMainExe)).rejects.toThrow(/mainExecutable/);
  });

  it('fails the build when the shortcut markup no longer matches', async () => {
    const withoutShortcuts = SAMPLE_WXS.replace(
      /<Shortcut[\s\S]*<\/Shortcut>/,
      ''
    );
    await expect(runHook(withoutShortcuts)).rejects.toThrow(
      /no advertised desktop or Start menu shortcut/
    );
  });
});
