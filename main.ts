import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
	TFile,
} from "obsidian";

import { CATView, VIEW_TYPE_EXAMPLE } from "./src/ui/CATView";
import { parseMarkdown } from "src/core/splitter";
import { StorageService } from "src/services/storage";
import { ConfirmModal } from "src/ui/modals";
import { TranslationData } from "src/types";

interface AbyssCATSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: AbyssCATSettings = {
	mySetting: "default",
};

export default class AbyssCAT extends Plugin {
	settings: AbyssCATSettings;
	storageService: StorageService;

	async onload() {
		await this.loadSettings();
		this.storageService = new StorageService(this.app);

		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new CATView(leaf));

		const parseIcon = this.addRibbonIcon(
			"lucide-cat",
			"Open CAT Translation",
			async (_evt: MouseEvent) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					await this.activateTranslationView(activeFile);
				} else {
					new Notice("Please open a markdown file to translate.");
				}
			}
		);

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.addCommand({
			id: "re-parse-document",
			name: "Re-parse Document",
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						this.overwriteTranslation(activeFile);
					}
					return true;
				}
				return false;
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateTranslationView(file: TFile) {
		let data = await this.storageService.loadTranslationData(file);

		if (data) {
			new Notice(`Loading existing translation data...`);
		} else {
			data = await this.createNewTranslation(file);
		}

		// TODO: pass data to view
	}

	async createNewTranslation(file: TFile): Promise<TranslationData> {
		new Notice(`Parsing document: ${file.name}`);

		const content = await this.app.vault.read(file);

		const data = parseMarkdown(content, file.path, file.stat.mtime);

		await this.storageService.saveTranslationData(file, data);

		new Notice(`Document parsing finished!`);

		return data;
	}

	async overwriteTranslation(file: TFile) {
		const action = await ConfirmModal.awaitUserAction(
			this.app,
			"Warning",
			"Existing translation metadata found for this document. Do you want to overwrite it by re-parsing the document? This action cannot be undone. Existing translations will be lost."
		);
		if (action === "overwrite") {
			new Notice("Re-parsing document...");

			const newData = await this.createNewTranslation(file);

			// TODO: open view with newData
		}
	}

	async activateView() {
		const { workspace } = this.app;

		// ckeck if view is opened
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// if opened, get the first one
			leaf = leaves[0];
		} else {
			// if not opened, create a new one
			leaf = workspace.getLeaf(true);
			await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		// reveal the view
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

class SampleSettingTab extends PluginSettingTab {
	plugin: AbyssCAT;

	constructor(app: App, plugin: AbyssCAT) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
