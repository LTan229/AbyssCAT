import { App, Notice, requestUrl } from "obsidian";
import React, { useEffect, useRef, useState } from "react";
import { CatEditor } from "src/ui/CatEditor";
import { TranslationData, Block, Segment } from "src/types";
import { useHistory } from "src/hooks/useHistory";

interface ContainerProps {
    initialData: TranslationData;
    app: App;
    onSave: (data: TranslationData) => void;
	onExport: () => void;
}

export const TranslationContainer = ({ 
	initialData, 
	app, 
	onSave,
	onExport
 }: ContainerProps) => {

    const { state: currentData, setState: updateData, undo, redo, canUndo, canRedo } = useHistory(initialData);

    const lastSavedDataRef = useRef<TranslationData>(initialData);

	const [isSelectionMode, setIsSelectionMode] = useState(false);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const [isTranslating, setIsTranslating] = useState(false);

	// const apiKey = await plugin.loadSettings().apiKey; 
	const apiKey = "YOUR_DEEPL_API_KEY";
    
    useEffect(() => {
        if (currentData === lastSavedDataRef.current) return;

        const timer = setTimeout(() => {
            console.log("Auto-saving...");
            onSave(currentData);
            lastSavedDataRef.current = currentData;
            new Notice("已自动保存");
        }, 5000);

        return () => clearTimeout(timer);
    }, [currentData, onSave]);

	// const handleKeyDown = (e: React.KeyboardEvent) => {
    //     const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    //     if (isCtrlOrMeta) {
    //         if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
    //             e.preventDefault();
    //             if (canUndo) {
    //                 undo();
    //             }
    //             return;
    //         }

    //         if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
    //             e.preventDefault();
    //             if (canRedo) {
    //                 redo();
    //             }
    //             return;
    //         }
    //     }
    // };

    const handleBatchTranslate = async () => {
        if (selectedIds.size === 0) {
            new Notice("请至少选择一行");
            return;
        }
        if (!apiKey) {
            new Notice("未配置 DeepL API Key");
            return;
        }

        setIsTranslating(true);
        new Notice(`开始批量翻译 ${selectedIds.size} 条数据...`);

        const segmentsToTranslate: { blockId: string; segment: Segment }[] = [];
        
        currentData.blocks.forEach(block => {
            block.segments.forEach(segment => {
                if (selectedIds.has(segment.id)) {
                    segmentsToTranslate.push({ blockId: block.id, segment });
                }
            });
        });

        try {
            const promises = segmentsToTranslate.map(async (item) => {
                try {
                    const response = await requestUrl({
                        url: "https://api-free.deepl.com/v2/translate",
                        method: "POST",
                        headers: {
                            "Authorization": `DeepL-Auth-Key ${apiKey}`,
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: new URLSearchParams({
                            text: item.segment.original,
                            target_lang: "ZH", // const target_lang = await plugin.loadSettings().target_lang; 
                        }).toString()
                    });

                    if (response.status === 200) {
                        const translatedText = response.json.translations[0]?.text;
                        return { 
                            blockId: item.blockId, 
                            segmentId: item.segment.id, 
                            text: translatedText,
                            success: true 
                        };
                    }
                } catch (err) {
                    console.error(err);
                }
                return { ...item, success: false };
            });

            const results = await Promise.all(promises);

            const newBlocks = currentData.blocks.map(block => {
                return {
                    ...block,
                    segments: block.segments.map(segment => {
                        const result = results.find(r => r.blockId === block.id && r.segmentId === segment.id);
                        if (result && result.success && result.text) {
                            return {
                                ...segment,
                                translation: result.text,
                                status: "translated" as const
                            };
                        }
                        return segment;
                    })
                };
            });

            updateData({ ...currentData, blocks: newBlocks });
            new Notice("批量翻译完成！");
            
            // setSelectedIds(new Set());
            // setIsSelectionMode(false);

        } catch (error) {
            console.error("批量翻译错误", error);
            new Notice("批量翻译过程出错");
        } finally {
            setIsTranslating(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    return (
        <div className="cat-view-wrapper">
            <div className="cat-header">
                <h3>翻译工作区</h3>
                <div className="cat-toolbar">
					{!isSelectionMode ? (
                        <button 
                            className="mod-cta" 
                            onClick={() => setIsSelectionMode(true)}
                        >
                            DeepL 批量模式
                        </button>
                    ) : (
                        <>
                            <span>已选: {selectedIds.size}</span>
                            <button 
                                className="mod-warning"
                                onClick={handleBatchTranslate}
                                disabled={isTranslating || selectedIds.size === 0}
                            >
                                {isTranslating ? "翻译中..." : "发送到 DeepL"}
                            </button>
                            <button onClick={() => {
                                setIsSelectionMode(false);
                                setSelectedIds(new Set());
                            }}>取消</button>
                        </>
                    )}
                    <button onClick={undo} disabled={!canUndo}>Undo</button>
                    <button onClick={redo} disabled={!canRedo}>Redo</button>
                    <button onClick={() => {
                        onSave(currentData);
                        new Notice("Saved.");
                    }}>Save</button>
					<button 
                        onClick={onExport} 
                        title="导出为 Markdown (Export)"
                        aria-label="Export"
                        style={{ cursor: 'pointer' }}
                    >
                        Export
                    </button>
                </div>
            </div>
            
            <div>
                <CatEditor 
                    data={currentData} 
                    onDataChange={updateData}
                    app={app}
					isSelectionMode={isSelectionMode}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                />
            </div>
        </div>
    );
};