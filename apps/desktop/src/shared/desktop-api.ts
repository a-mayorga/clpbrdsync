export type DesktopRuntimeInfo = {
  platform: NodeJS.Platform;
  appVersion: string;
  processStartedAt: string;
};

export interface DesktopApi {
  getRuntimeInfo(): Promise<DesktopRuntimeInfo>;
}
