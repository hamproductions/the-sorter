import { initializeStorage } from '~/utils/storage';

export const onBeforeRenderClient = async () => {
  await initializeStorage();
};
