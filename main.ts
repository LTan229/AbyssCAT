import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";

import { CATView, CAT_VIEW_TYPE } from "src/ui/CATView";
import { parseMarkdown, spliceMeta } from "src/core/splitter";
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

		this.registerView(CAT_VIEW_TYPE, (leaf) => new CATView(leaf));

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
			},
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

		this.addCommand({
			id: "export-translation",
			name: "Export Translation Result",
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						this.exportTranslation(activeFile);
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
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateTranslationView(file: TFile, createOnExist: boolean = false) {
		let data = await this.storageService.loadTranslationData(file);

		if ((!data) || createOnExist) {
			data = await this.createNewTranslation(file);
		} 

		let leaf = this.app.workspace.getLeavesOfType(CAT_VIEW_TYPE)[0];
		if (!leaf) {
			leaf = this.app.workspace.getLeaf(false);
		}

		await leaf.setViewState({ type: CAT_VIEW_TYPE });
		const view = leaf.view as CATView;
		view.setTranslationData(
			data,
			file,
			async (f, d) => {
				await this.storageService.saveTranslationData(f, d);
			},
			async (f) => {
				await this.exportTranslation(f);
			},
		);

		this.app.workspace.revealLeaf(leaf);
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
			"Overwrite Translation Metadata",
			"Existing translation metadata found for this document. Do you want to overwrite it by re-parsing the document? This action cannot be undone. Existing translations will be lost.",
			"Cancel",
			"Confirm Overwrite",
		);

		if (action !== "confirm") {
			return;
		}

		await this.activateTranslationView(file, true);
	}

	async exportTranslation(file: TFile) {
		const data = await this.storageService.loadTranslationData(file);

		if (!data) {
			new Notice("No translation data found. Please parse the document first.");
			return;
		}

		const action = await ConfirmModal.awaitUserAction(
			this.app,
			"Export Translation",
			"Existing translation found for this document. Do you want to overwrite it by exporting again? This action cannot be undone. Existing exported translation will be lost.",
			"Cancel",
			"Confirm Overwrite",
		);
		if (action !== "confirm") {
			return;
		}

		new Notice(`Exporting translation for ${file.basename}...`);

		const finalContent = spliceMeta(data);

		const path = await this.storageService.saveTranslation(
			finalContent,
			file.parent,
			file.basename,
		);

		new Notice(`Translation exported at ${path}`);
	}
}
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
					}),
			);
	}
}
