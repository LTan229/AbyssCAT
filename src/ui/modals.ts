import { App, Modal, Setting } from "obsidian";

type ModalAction = "cancel" | "confirm";

export class ConfirmModal extends Modal {
	title: string;
	message: string;
	cancelText: string;
	confirmText: string;
	private resolve: (value: ModalAction) => void;
	private resolved: boolean = false;

	constructor(
		app: App,
		title: string,
		message: string,
		cancelText: string,
		confirmText: string,
		resolve: (value: ModalAction) => void,
	) {
		super(app);
		this.title = title;
		this.message = message;
		this.cancelText = cancelText;
		this.confirmText = confirmText;
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: this.title });
		contentEl.createEl("p", { text: this.message });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText(this.cancelText)

					.setCta()

					.onClick(() => {
						this.resolve("cancel");
						this.resolved = true;
						this.close();
					}),
			)
			.addButton((btn) =>
				btn
					.setButtonText(this.confirmText)

					.onClick(() => {
						this.resolve("confirm");
						this.resolved = true;
						this.close();
					}),
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
		message: string,
		cancelText: string = "Cancel",
		confitmText: string = "Confirm",
	): Promise<ModalAction> {
		return new Promise<ModalAction>((resolve) => {
			new ConfirmModal(
				app,
				title,
				message,
				cancelText,
				confitmText,
				resolve,
			).open();
		});
	}
}
