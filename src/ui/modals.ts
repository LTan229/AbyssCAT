import { App, Modal, Setting } from "obsidian";

type ModalAction = "cancel" | "overwrite";

export class ConfirmModal extends Modal {
	title: string;
	message: string;
	private resolve: (value: ModalAction) => void;
	private resolved: boolean = false;

	constructor(
		app: App,
		title: string,
		message: string,
		resolve: (value: ModalAction) => void
	) {
		super(app);
		this.title = title;
		this.message = message;
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: this.title });
		contentEl.createEl("p", { text: this.message });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Cancel")

					.setCta() // call to action

					.onClick(() => {
						this.resolve("cancel");
						this.resolved = true;
						this.close();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Confirm overwrite")

					.onClick(() => {
						this.resolve("overwrite");
						this.resolved = true;
						this.close();
					})
			);
	}

	onClose() {
		if (!this.resolved) {
			this.resolve("cancel");
		}
		this.contentEl.empty();
	}

	static awaitUserAction(
		app: App,
		title: string,
		message: string
	): Promise<ModalAction> {
		return new Promise<ModalAction>((resolve) => {
			new ConfirmModal(app, title, message, resolve).open();
		});
	}
}
