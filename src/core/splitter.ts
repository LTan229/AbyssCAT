// src/core/splitter.ts
import { Block, Segment, TranslationData } from "../types";

function generateId(): string {
	return Math.random().toString(36).substring(2, 9);
}

/**
 * 判断一行是否是纯粹的 Markdown 结构行（如分割线，Setext 下划线）
 * 这些行不应该被翻译，Content 应为空
 */
function isStructuralLine(line: string): boolean {
	const trimmed = line.trim();
	// 匹配 ---, ***, === (至少3个)
	if (/^([-*=])\1{2,}$/.test(trimmed)) return true;
	return false;
}

/**
 * 智能分句算法
 * 1. 处理句尾标点粘连 (e.g. "Hello.**")
 * 2. 保护 URL 和版本号 (e.g. "www.baidu.com" 不会切分)
 */
function splitSentences(text: string): string[] {
	if (!text) return [];

	// 正则逻辑详解：
	// 1. ([^.?!。？！…\n]+)  : text
	// 2. ([.?!。？！…]+)     : stop punctuation
	// 3. (?![\w\d\/])        : only cut if a punctuation is not followed by a letter or digit
	// 4. (['"”’\)\]*~=_`]*) : trailing chars
	// 5. | (.+)             : catch-all for any remaining text
	const regex =
		/([^.?!。？！…\n]+[.?!。？！…]+(?![\w\d\/])['"”’\)\]*~=_`]*)|(.+)/g;

	const segments: string[] = [];
	let match;

	while ((match = regex.exec(text)) !== null) {
		const trimmed = match[0].trim();
		if (trimmed) {
			segments.push(trimmed);
		}
	}

	if (segments.length === 0 && text.trim()) {
		return [text];
	}

	return segments;
}

export function parseMarkdown(
	fileContent: string,
	sourcePath: string,
	mtime: number
): TranslationData {
	const lines = fileContent.split(/\r?\n/);
	const blocks: Block[] = [];

	// ^(\s*)               : indent
	// #{1,6}\s+            : title
	// [-*+]\s+             : unorderd list
	// \d+\.\s+             : ordered list
	// >\s*\[![\w-]+\]\s*  	: Callout head (> [!info] )
	// >\s* 				: quote
	// \[.+\]:\s+           : link and annotation
	const prefixRegex =
		/^(\s*)(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s*\[![\w-]+\]\s*|>\s*|\[.+\]:\s+)/;

	lines.forEach((line, index) => {
		let prefix = "";
		let content = line;

		// structural line check
		if (isStructuralLine(line)) {
			blocks.push({
				id: generateId(),
				lineIndex: index,
				prefix: line,
				segments: [],
			});
			return;
		}

		// extract prefix
		const match = line.match(prefixRegex);
		if (match) {
			prefix = match[0];
			content = line.substring(prefix.length);
		} else {
			const indentMatch = line.match(/^(\s+)/);
			if (indentMatch) {
				prefix = indentMatch[1];
				content = line.substring(prefix.length);
			}
		}

		// sentence split
		let rawSegments: string[] = [];

		if (!content.trim()) {
			if (content.length > 0) rawSegments = [content];
			else rawSegments = [""];
		} else {
			rawSegments = splitSentences(content);
		}

		const segmentsObj = rawSegments.map((text) => ({
			id: generateId(),
			original: text,
			translation: "",
			status: "original" as const,
		}));

		blocks.push({
			id: generateId(),
			lineIndex: index,
			prefix: prefix,
			segments: segmentsObj,
		});
	});

	return {
		sourcePath: sourcePath,
		lastModified: mtime,
		blocks: blocks,
	};
}

export function spliceMeta(data: TranslationData): string {
	const exportedLines = data.blocks.map((block) => {
				const blockContent = block.segments
					.map((seg) => {
						if (seg.translation && seg.translation.trim() !== "") {
							return seg.translation;
						}
						return seg.original;
					})
					.join(""); 
	
				return `${block.prefix}${blockContent}`;
			});
	
	return exportedLines.join("\n");
}