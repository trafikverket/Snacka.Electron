import { runElectronBuilder } from './shell';

export const packOnLinux = (): Promise<void> =>
  runElectronBuilder(`--linux tar.gz deb rpm AppImage`);
