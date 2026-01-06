import { App, TFile, TFolder, normalizePath } from "obsidian";
import { TranslationData } from "../types";

const DATA_FOLDER = ".catdata";

export class StorageService {
	app: App;

	constructor(app: App) {
		this.app = app;
	}

	getStoragePath(sourceFile: TFile): string {
		return normalizePath(`${DATA_FOLDER}/${sourceFile.basename}.json`);
	}

	async ensureFolderExists() {
		if (!(await this.app.vault.adapter.exists(DATA_FOLDER))) {
			await this.app.vault.createFolder(DATA_FOLDER);
		}
	}

	async loadTranslationData(
		sourceFile: TFile
	): Promise<TranslationData | null> {
		await this.ensureFolderExists();
		const path = this.getStoragePath(sourceFile);
		if (await this.app.vault.adapter.exists(path)) {
			const content = await this.app.vault.adapter.read(path);
			return JSON.parse(content) as TranslationData;
		}
		return null;
	}

	async saveTranslationData(sourceFile: TFile, data: TranslationData) {
		await this.ensureFolderExists();
		const path = this.getStoragePath(sourceFile);
		const fileContent = JSON.stringify(data, null, 2);
		await this.app.vault.adapter.write(path, fileContent);
	}

	async deleteTranslationData(sourceFile: TFile) {
		const path = this.getStoragePath(sourceFile);
		if (await this.app.vault.adapter.exists(path)) {
			await this.app.vault.adapter.remove(path);
		}
	}

	async saveTranslation(content: string, parentFolder: TFolder | null, sourceFileName: string) {
		const parentPath = parentFolder ? parentFolder.path : "/";
		const newFileName = `${sourceFileName}_translation.md`;
		
		const exportFilePath = normalizePath(`${parentPath}/${newFileName}`);
		await this.app.vault.adapter.write(exportFilePath, content);
	}
}
