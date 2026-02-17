import * as path from 'path';
import * as core from '@actions/core';
import { runElectronBuilder } from '../shell';
import { setupCertificates } from './certificates';
import {
  setupGoogleCloudAuth,
  installGoogleCloudCLI,
  authenticateGcloud,
} from './google-cloud';
import { installKmsCngProvider } from './kms-provider';
import { findSigntool, installJsign } from './signing-tools';
import { signBuiltPackages } from './sign-packages';
import { updateYamlChecksums } from './update-yaml-checksums';
import {
  verifyExecutableSignature,
  verifyInstallerSignatures,
} from './verify-signature';

export const packOnWindows = async (): Promise<void> => {
  try {
    // --- Signerings- och Google Cloud-steg är utkommenterade för intern build ---
    // await findSigntool();
    // const credentialsPath = await setupGoogleCloudAuth();
    // const userCertPath = await setupCertificates();
    // const kmsKeyResource = core.getInput('win_kms_key_resource');
    // if (!kmsKeyResource) {
    //   throw new Error('win_kms_key_resource input is required');
    // }
    // core.info('Setting up signing environment before build...');
    // await installJsign();
    // const gcloudPath = await installGoogleCloudCLI();
    // await authenticateGcloud(credentialsPath, gcloudPath);
    // const buildEnv = {
    //   WIN_KMS_KEY_RESOURCE: kmsKeyResource,
    //   WIN_CERT_FILE: userCertPath,
    //   GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
    //   GCLOUD_PATH: gcloudPath,
    // };
    // process.env.WIN_KMS_KEY_RESOURCE = kmsKeyResource;
    // process.env.WIN_CERT_FILE = userCertPath;
    // process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    // process.env.GCLOUD_PATH = gcloudPath;

    core.info('Building Windows packages (unsigned, internal use)...');

    // Bygg utan signeringsmiljö
    await runElectronBuilder(`--x64 --ia32 --arm64 --win nsis`);
    await runElectronBuilder(`--x64 --ia32 --arm64 --win msi`);
    await runElectronBuilder(`--x64 --ia32 --arm64 --win appx`);

    core.info('✅ All Windows packages built (unsigned)');

    // const distPath = path.resolve(process.cwd(), 'dist');
    // core.info('Verifying executable signatures...');
    // await verifyExecutableSignature(distPath);
    // core.info('Installing KMS CNG provider for installer signing...');
    // await installKmsCngProvider();
    // core.info('Signing installer packages...');
    // await signBuiltPackages(distPath);
    // core.info('Verifying installer signatures...');
    // await verifyInstallerSignatures(distPath);
    // core.info('Updating latest.yml with correct checksums...');
    // await updateYamlChecksums(distPath);
    // core.info('✅ Windows packages built, signed, and verified successfully');
  } catch (error) {
    core.error(`Failed to build Windows packages: ${error}`);
    throw error;
  }
};
