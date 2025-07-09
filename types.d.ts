declare module 'obsidian' {
	interface App {
		workspace: Workspace;
		vault: Vault;
	}

	interface Vault {
		getAbstractFileByPath(path: string): TAbstractFile | null;
		create(path: string, content: string): Promise<TFile>;
		getMarkdownFiles(): TFile[];
		read(file: TFile): Promise<string>;
		on(event: string, callback: (file: TFile) => void): void;
		adapter: VaultAdapter;
	}

	interface VaultAdapter {
		getFullPath(path: string): string;
	}

	interface TAbstractFile {
		path: string;
		name: string;
	}

	interface TFile extends TAbstractFile {
		basename: string;
		// Propriedades específicas de arquivo
	}

	interface TFolder extends TAbstractFile {
		// Propriedades específicas de pasta
	}

	interface Workspace {
		getLeavesOfType(type: string): WorkspaceLeaf[];
		getRightLeaf(active: boolean): WorkspaceLeaf;
		revealLeaf(leaf: WorkspaceLeaf): void;
		getLeaf(): WorkspaceLeaf;
		getActiveFile(): TFile | null;
		on(event: string, callback: (...args: any[]) => void): void;
	}

	interface WorkspaceLeaf {
		containerEl: HTMLElement;
		setViewState(state: any): Promise<void>;
		openFile(file: TFile): Promise<void>;
	}

	class Plugin {
		app: App;
		registerView(type: string, viewCreator: (leaf: WorkspaceLeaf) => ItemView): void;
		addCommand(command: any): void;
		addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => void): void;
		addSettingTab(tab: PluginSettingTab): void;
		saveData(data: any): Promise<void>;
		loadData(): Promise<any>;
		registerEvent(event: any): void;
	}

	class PluginSettingTab {
		containerEl: HTMLElement;
		constructor(app: App, plugin: Plugin);
		display(): void;
	}

	class ItemView {
		containerEl: HTMLElement;
		constructor(leaf: WorkspaceLeaf);
		onOpen(): Promise<void>;
		onClose(): Promise<void>;
		getViewType(): string;
		getDisplayText(): string;
		getIcon(): string;
	}

	class Setting {
		constructor(containerEl: HTMLElement);
		setName(name: string): Setting;
		setDesc(desc: string): Setting;
		addText(callback: (text: TextComponent) => void): Setting;
		addToggle(callback: (toggle: ToggleComponent) => void): Setting;
		addButton(callback: (button: ButtonComponent) => void): Setting;
		addExtraButton(callback: (button: ButtonComponent) => void): Setting;
	}

	interface TextComponent {
		setPlaceholder(placeholder: string): TextComponent;
		setValue(value: string): TextComponent;
		onChange(callback: (value: string) => void): TextComponent;
	}

	interface ToggleComponent {
		setValue(value: boolean): ToggleComponent;
		onChange(callback: (value: boolean) => void): ToggleComponent;
	}

	interface ButtonComponent {
		setButtonText(text: string): ButtonComponent;
		setWarning(warning: boolean): ButtonComponent;
		setIcon(icon: string): ButtonComponent;
		setTooltip(tooltip: string): ButtonComponent;
		onClick(callback: () => void): ButtonComponent;
	}

	class Notice {
		constructor(message: string);
	}

	// Extensões do HTMLElement
	interface HTMLElement {
		createEl<K extends keyof HTMLElementTagNameMap>(
			tag: K,
			o?: DomElementInfo | string
		): HTMLElementTagNameMap[K];
		createDiv(cls?: string, o?: DomElementInfo): HTMLDivElement;
		empty(): void;
	}

	interface DomElementInfo {
		text?: string;
		cls?: string;
		attr?: Record<string, string>;
		title?: string;
		prepend?: boolean;
	}
}

// Declaração global para require
declare function require(module: string): any; 