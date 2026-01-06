import { App, Notice, requestUrl } from "obsidian";
import React, { useRef } from "react";
import { TranslationData, Block, Segment } from "src/types";

interface CatEditorProps {
    data: TranslationData;
    onDataChange: (newData: TranslationData) => void;
    app: App;
    isSelectionMode: boolean;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
}

export const CatEditor = ({ 
    data, 
    onDataChange, 
    app,
    isSelectionMode,
    selectedIds,
    onToggleSelection
}: CatEditorProps) => {

    const inputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

    const handleTranslationChange = (blockId: string, segmentId: string, value: string) => {
        const newData = {
            ...data,
            blocks: data.blocks.map((block) => {
                if (block.id !== blockId) return block;
                return {
                    ...block,
                    segments: block.segments.map((segment) => {
                        if (segment.id !== segmentId) return segment;
                        return { ...segment, 
                            translation: value, 
                            status: value.trim() !== "" ? "translated" as const : "original" as const
                        };
                    })
                };
            })
        };
        onDataChange(newData);
    };

    const getBlockBadge = (currentBlock: Block, nextBlock?: Block): string | null => {
        const p = currentBlock.prefix.trim();

        if (p === '#') return 'H1';
        if (p === '##') return 'H2';
        if (p === '###') return 'H3';
        if (/^#{4,6}$/.test(p)) return 'H' + p.length; 

        if (nextBlock) {
            const nextContent = (nextBlock.prefix + nextBlock.segments.map(s=>s.original).join('')).trim();
            if (/^=+$/.test(nextContent)) return 'H1';
            if (/^-+$/.test(nextContent)) return 'H2'; 
        }

        // if (p.startsWith('>')) return 'QUOTE';
        
        return null;
    };

    return (
        <div className="cat-editor-container">
            {data.blocks.map((block, index) => {
                const validSegments = block.segments.filter(
                    (segment) => segment.original && segment.original.trim() !== ""
                );

                if (validSegments.length === 0) return null;

                const nextBlock = data.blocks[index + 1];
                const badgeLabel = getBlockBadge(block, nextBlock);

                return (
                    <div key={block.id} className="cat-block">
                        {validSegments.map((segment) => (
                            <div key={segment.id} className="cat-segment-row">
                                {isSelectionMode && (
                                    <div className="cat-checkbox-col">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(segment.id)}
                                            onChange={() => onToggleSelection(segment.id)}
                                            style={{ cursor: "pointer" }}
                                        />
                                    </div>
                                )}

                                <div className="cat-source">
                                    {badgeLabel && (
                                        <span className="cat-badge">{badgeLabel}</span>
                                    )}
                                    <div 
                                        className="cat-input-box source-read-only"
                                        onClick={() => isSelectionMode && onToggleSelection(segment.id)}
                                    >
                                        {segment.original}
                                    </div>
                                </div>
                                
                                <div className="cat-target">
                                    <textarea
                                        ref={(el) => {
                                            if (el) inputRefs.current.set(segment.id, el);
                                            else inputRefs.current.delete(segment.id);
                                        }}
                                        className="cat-input-box"
                                        value={segment.translation || ""}
                                        onChange={(e) => handleTranslationChange(block.id, segment.id, e.target.value)}
                                        placeholder="Translation..."
                                        rows={1}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = "auto";
                                            target.style.height = `${target.scrollHeight}px`;
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};