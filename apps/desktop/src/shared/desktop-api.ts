export type DesktopRuntimeInfo = {
  platform: NodeJS.Platform;
  appVersion: string;
};

export interface DesktopApi {
  getRuntimeInfo(): Promise<DesktopRuntimeInfo>;
}
