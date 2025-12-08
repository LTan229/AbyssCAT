// src/types.ts

export interface Segment {
	id: string;
	original: string;
	translation: string;
	status: "original" | "translated" | "confimed";
}

export interface Block {
	id: string;
	lineIndex: number;
	prefix: string;
	segments: Segment[];
}

export interface TranslationData {
	sourcePath: string;
	lastModified: number;
	blocks: Block[];
}
