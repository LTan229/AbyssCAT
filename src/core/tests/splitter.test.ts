import { parseMarkdown } from "../splitter";

// 模拟数据
const mockPath = "test.md";
const mockMtime = 123456789;

describe("Splitter Core Logic", () => {
	test("Basic Sentence Splitting", () => {
		const input = "Hello World. This is a test.";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].segments.length).toBe(2);
		expect(result.blocks[0].segments[0].original).toBe("Hello World.");
		expect(result.blocks[0].segments[1].original).toBe("This is a test.");
	});

	test("Heading Handling", () => {
		const input = "## This is a Heading";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].prefix).toBe("## ");
		expect(result.blocks[0].segments.length).toBe(1);
		expect(result.blocks[0].segments[0].original).toBe("This is a Heading");
	});

	test("Underline Heading", () => {
		const input = "=======";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].prefix).toBe("=======");
		expect(result.blocks[0].segments.length).toBe(0);
	});

	test("Bold Test", () => {
		const input = "**Bold Statement.** __Another sentence.__";
		const result = parseMarkdown(input, mockPath, mockMtime);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].segments.length).toBe(2);
		expect(result.blocks[0].segments[0].original).toBe(
			"**Bold Statement.**"
		);
		expect(result.blocks[0].segments[1].original).toBe(
			"__Another sentence.__"
		);
	});

	test("Italic Test", () => {
		const input = "*Italic statement.* _Another one._";
		const result = parseMarkdown(input, mockPath, mockMtime);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].segments.length).toBe(2);
		expect(result.blocks[0].segments[0].original).toBe(
			"*Italic statement.*"
		);
		expect(result.blocks[0].segments[1].original).toBe("_Another one._");
	});

	test("Highlight Test", () => {
		const input = "==Highlighted text.== More text.";
		const result = parseMarkdown(input, mockPath, mockMtime);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].segments.length).toBe(2);
		expect(result.blocks[0].segments[0].original).toBe(
			"==Highlighted text.=="
		);
		expect(result.blocks[0].segments[1].original).toBe("More text.");
	});

	test("Markdown Prefix Extraction (Lists)", () => {
		const input = "- List Item 1";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks[0].prefix).toBe("- ");
		expect(result.blocks[0].segments[0].original).toBe("List Item 1");
	});

	test("Markdown Prefix Extraction (Ordered Lists)", () => {
		const input = "11. First Item";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks[0].prefix).toBe("11. ");
		expect(result.blocks[0].segments[0].original).toBe("First Item");
	});

	test("Callout Handling", () => {
		const input = "> [!info] Info Title";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks[0].prefix).toBe("> [!info] ");
		expect(result.blocks[0].segments[0].original).toBe("Info Title");
	});

	test("URL Protection", () => {
		const input = "[Link](https://www.example.com/path/to/file)";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks[0].segments.length).toBe(1);
		expect(result.blocks[0].segments[0].original).toBe(
			"[Link](https://www.example.com/path/to/file)"
		);
	});

	test("Version Number Protection", () => {
		const input = "Ver 1.0 is released.";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks[0].segments.length).toBe(1);
		expect(result.blocks[0].segments[0].original).toBe(
			"Ver 1.0 is released."
		);
	});

	test("Link Reference Handling", () => {
		const input = "![img](www.baidu.com/image.png)";
		const result = parseMarkdown(input, mockPath, mockMtime);

		expect(result.blocks[0].segments.length).toBe(1);
		expect(result.blocks[0].segments[0].original).toBe(
			"![img](www.baidu.com/image.png)"
		);
	});
});
