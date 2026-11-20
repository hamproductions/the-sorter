import { initializeStorage } from '~/utils/storage';
import { installRuntimeAssetRecovery } from '~/utils/asset-recovery';

export const onBeforeRenderClient = async () => {
  await initializeStorage();
  installRuntimeAssetRecovery();
};
