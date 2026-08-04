import { join } from 'node:path';
import { app, Menu, nativeImage, Tray } from 'electron';

type TrayManagerOptions = {
	onToggleWindow(): void;
	onShowWindow(): void;
	onQuit(): void;
};

export class TrayManager {
	private tray: Tray | null = null;

	constructor(private readonly options: TrayManagerOptions) {}

	initialize(): void {
		if (this.tray) {
			return;
		}

		const iconPath = app.isPackaged
			? join(process.resourcesPath, 'icon.png')
			: join(app.getAppPath(), 'resources/icon.png');
		const icon = nativeImage.createFromPath(iconPath);

		if (icon.isEmpty()) {
			throw new Error(`Could not load tray icon from: ${iconPath}`);
		}

		const trayIcon = icon.resize({
			width: 16,
			height: 16,
			quality: 'best'
		});

		const tray = new Tray(trayIcon);

		tray.setToolTip('ClpbrdSync');

		tray.setContextMenu(
			Menu.buildFromTemplate([
				{
					label: 'Open ClpbrdSync',
					click: () => {
						this.options.onShowWindow();
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'Quit',
					click: () => {
						this.options.onQuit();
					}
				}
			])
		);

		tray.on('click', () => {
			this.options.onToggleWindow();
		});

		this.tray = tray;
	}

	dispose(): void {
		this.tray?.destroy();
		this.tray = null;
	}
}
