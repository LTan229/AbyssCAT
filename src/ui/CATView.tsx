import { StrictMode } from "react";
import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { TranslationContainer } from "src/ui/TranslationContainer";
import React from "react";
import { TranslationData } from "src/types";
import { StorageService } from "src/services/storage";

export const CAT_VIEW_TYPE = "cat-view";

export class CATView extends ItemView {
	root: Root | null = null;
	data: TranslationData | null = null;
	sourceFile: TFile | null = null;
	private saveCallback: ((file: TFile, data: TranslationData) => Promise<void>) | null = null;
	private exportCallback: ((file: TFile) => Promise<void>) | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return CAT_VIEW_TYPE;
	}

	getDisplayText() {
		return this.sourceFile ? `翻译: ${this.sourceFile.basename}` : "CAT 翻译视图";
	}

	getIcon() { return "languages"; }

	async setTranslationData(
		data: TranslationData, 
		sourceFile: TFile,
		saveCallback: (file: TFile, data: TranslationData) => Promise<void>,
		exportCallback: (file: TFile) => Promise<void>
	) {
		this.data = data;
		this.sourceFile = sourceFile;
		this.saveCallback = saveCallback;
		this.exportCallback = exportCallback;
		this.render();
	}

	async onOpen() {
		this.render();
	}

	async onClose() {
		this.root?.unmount();
	}

	private render() {
		const container = this.containerEl.children[1];
		container.empty();

		if (!this.data) {
			container.createEl("div", { text: "没有可显示的翻译数据。" });
			return;
		}

		this.root = createRoot(container);
		this.root.render(
			<StrictMode>
				<TranslationContainer
					initialData={this.data}
					app={this.app}
					onSave={async (newData) => {
						this.data = newData;
						if (this.sourceFile && this.saveCallback) {
							await this.saveCallback(this.sourceFile, newData);
						}
					}}
					onExport={async () => {
                    if (this.sourceFile && this.exportCallback) {
                        await this.exportCallback(this.sourceFile);
                    }
                }}
				/>
			</StrictMode>
		);
	}

}
