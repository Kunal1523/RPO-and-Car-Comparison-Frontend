// components/PlanningGrid.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  FINANCIAL_YEARS as DEFAULT_FINANCIAL_YEARS,
  QUARTERS,
  MONTH_LABELS,
  SPECIAL_VALUES,
} from "../utils/constants";
import { getCellKey, stringToColor, isModel } from "../utils/utils";
import { ViewMode, FinancialYear } from "../utils/types";
import { X, GripVertical, Info } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PlanningGridProps {
  viewMode: ViewMode;
  rowIds: string[];
  cellData: Record<string, string[]>;
  isEditable?: boolean;
  onCellChange?: (rowId: string, year: string, month: number, value: string) => void;
  onCellClick?: (rowId: string, values: string[]) => void;
  highlightRow?: string | null;
  financialYears?: FinancialYear[];
  onDeleteYear?: (yearLabel: string) => void;
  onDeleteRow?: (rowId: string) => void;
  onRowReorder?: (newOrder: string[]) => void;
  layout?: { colWidths: Record<string, number>; rowHeights: Record<string, number> };
  onLayoutChange?: (
    colWidths: Record<string, number>,
    rowHeights: Record<string, number>
  ) => void;
  onRenameRow?: (oldId: string, newId: string) => void;
  // Granularity
  viewResolution?: "Month" | "Quarter" | "Year";
  visibleLevels?: { years: boolean; quarters: boolean; months: boolean };
  onAddRegulationFromDrag?: (name: string) => void;
  onAddModelToCell?: (rowId: string, year: string, month: number, model: string) => void;
  // NEW: Highlighting
  highlightedModel?: string | null;
  highlightedRegulation?: string | null;
  // NEW: Colors
  itemColors: Record<string, string>;
}

const DraggableRow = ({
  rowId,
  financialYears,
  cellData,
  isEditable,
  highlightRow,
  onCellClick,
  onCellChange,
  onDeleteRow,
  editingKey,
  startEdit,
  isCellEditing,
  draftValue,
  setDraftValue,
  commitEdit,
  cancelEdit,
  armedDragKey,
  setArmedDragKey,
  dragOverKey,
  setDragOverKey,
  moveCellValues,
  isDraggable,
  height,
  onRowResizeStart,
  firstColWidth,
  viewResolution = "Month",
  onRenameRow,
  onAddModelToCell,
  viewMode,
  highlightedModel,
  highlightedRegulation,
  itemColors,
}: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rowId, disabled: !isDraggable });

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(rowId);

  // Sync state if prop changes (though usually rowId change unmounts/remounts)
  useEffect(() => {
    if (!isRenaming) setRenameValue(rowId);
  }, [rowId, isRenaming]);

  const commitRename = () => {
    if (renameValue.trim() !== "" && renameValue !== rowId) {
      onRenameRow?.(rowId, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : "auto",
    position: isDragging ? ("relative" as const) : undefined,
    height: height ? `${height}px` : undefined, // Apply dynamic height
  };

  // Analytics for the whole row (computed once)
  const rowCounts: Record<string, number> = {};
  let firstDeadlineGlobalIdx: number | null = null;

  // Map months to global index (0-35)
  const allMonths: { fy: string, m: number, q: string }[] = [];
  financialYears.forEach((f: FinancialYear) => {
    QUARTERS.forEach(q => q.months.forEach(m => {
      allMonths.push({ fy: f.label, m, q: q.label });
    }));
  });

  allMonths.forEach((item, idx) => {
    const k = getCellKey(rowId, item.fy, item.m);
    const vals = cellData[k] || [];
    vals.forEach((v: string) => {
      if (viewMode === 'Regulation') {
        rowCounts[v] = (rowCounts[v] || 0) + 1;
      }
      if (v.toLowerCase().includes('deadline') && firstDeadlineGlobalIdx === null) {
        firstDeadlineGlobalIdx = idx;
      }
    });
  });

  const getShortYear = (fyLabel: string, month: number) => {
    // FY 25-26 -> [25, 26]
    const parts = fyLabel.replace('FY ', '').split('-');
    return month >= 4 ? parts[0] : parts[1];
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${highlightRow === rowId ? "bg-blue-100" : "hover:bg-gray-50"} ${isDragging ? "opacity-50" : ""
        }`}
    >
      {/* First Column: Drag Handle + Row ID + Delete */}
      <td
        className="sticky-left font-bold border-r-2 border-gray-300 px-3 text-blue-900 group-row h-full"
        style={
          firstColWidth
            ? {
              width: `${firstColWidth}px`,
              minWidth: `${firstColWidth}px`,
              maxWidth: `${firstColWidth}px`,
            }
            : undefined
        }
      >
        <div className="flex items-center justify-between gap-2 h-full min-h-[40px]">
          {isDraggable && (
            <span
              {...attributes}
              {...listeners}
              className="cursor-grab hover:text-blue-600 text-gray-400 touch-none flex items-center justify-center p-1"
              title="Drag to reorder"
            >
              <GripVertical size={14} />
            </span>
          )}

          {/* Row Resizer Handle */}
          <div
            className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-400 z-10"
            onMouseDown={(e) => onRowResizeStart(e, rowId)}
          />

          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setIsRenaming(false);
                e.stopPropagation(); // Prevent drag triggers if any
              }}
              className="flex-grow text-center text-sm font-bold border rounded px-1 min-w-0"
            />
          ) : (
            <span
              className={`flex-grow text-center truncate ${isEditable ? "cursor-text hover:bg-gray-100 rounded px-1" : ""}`}
              onDoubleClick={(e) => {
                if (isEditable && onRenameRow) {
                  setIsRenaming(true);
                  e.stopPropagation();
                }
              }}
            >
              {rowId}
            </span>
          )}

          {isEditable && typeof onDeleteRow === "function" && !isRenaming && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Remove "${rowId}" from this draft?`)) onDeleteRow(rowId);
              }}
              className="p-1 hover:bg-red-100 rounded text-gray-300 hover:text-red-500 transition-colors"
              title={`Remove ${rowId}`}
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </td>

      {/* Data Cells */}
      {financialYears.map((fy: FinancialYear, yearIdx: number) => {

        if (viewResolution === "Year") {
          // Year Aggregation
          const aggregated: { val: string, dateTag: string }[] = [];
          QUARTERS.forEach(q => q.months.forEach(m => {
            (cellData[getCellKey(rowId, fy.label, m)] || []).forEach((v: string) => {
              const tag = isModel(v) ? ` (${q.label}, ${m}/${getShortYear(fy.label, m)})` : "";
              aggregated.push({ val: v, dateTag: tag });
            });
          }));

          return (
            <td key={`${fy.label}-year`} className="month-col border-r border-b border-gray-200 p-2 align-top">
              <div className="flex flex-wrap gap-1">
                {aggregated.map((item, i) => {
                  const isDeadline = item.val.toLowerCase().includes('deadline');
                  const bgColor = isDeadline ? '#FEE2E2' : (itemColors[item.val] || stringToColor(item.val));
                  return (
                    <span
                      key={i}
                      className={`${isDeadline ? 'text-red-800' : 'text-gray-900'} text-[10px] px-2 py-1 rounded shadow-sm font-bold`}
                      style={{ backgroundColor: bgColor }}
                    >
                      {item.val}{item.dateTag}
                    </span>
                  );
                })}
              </div>
            </td>
          );
        }

        if (viewResolution === "Quarter") {
          // Quarter Aggregation
          return (
            <React.Fragment key={`${fy.label}-quarters`}>
              {QUARTERS.map(q => {
                const aggregated: { val: string, dateTag: string }[] = [];
                q.months.forEach(m => {
                  (cellData[getCellKey(rowId, fy.label, m)] || []).forEach((v: string) => {
                    const tag = isModel(v) ? ` (${m}/${getShortYear(fy.label, m)})` : "";
                    aggregated.push({ val: v, dateTag: tag });
                  });
                });

                return (
                  <td key={`${fy.label}-${q.label}`} className="month-col border-r border-b border-gray-200 p-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {aggregated.map((item, i) => {
                        const isDeadline = item.val.toLowerCase().includes('deadline');
                        const bgColor = isDeadline ? '#FEE2E2' : (itemColors[item.val] || stringToColor(item.val));
                        return (
                          <span
                            key={i}
                            className={`${isDeadline ? 'text-red-800' : 'text-gray-900'} text-[10px] px-2 py-1 rounded shadow-sm font-bold`}
                            style={{ backgroundColor: bgColor }}
                          >
                            {item.val}{item.dateTag}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </React.Fragment>
          );
        }

        // Default: Month View
        return (
          <React.Fragment key={`${fy.label}-row`}>
            {QUARTERS.map((q) => (
              <React.Fragment key={`${fy.label}-${q.label}-row`}>
                {q.months.map((m) => {
                  const key = getCellKey(rowId, fy.label, m);
                  const values = cellData[key] || [];
                  const displayValue = values.join(", ");

                  const editing = isCellEditing(key);
                  const isArmed = armedDragKey === key;
                  const isOver = dragOverKey === key;

                  return (
                    <td
                      key={key}
                      className={[
                        "month-col relative group align-top text-black border-r border-b border-gray-200",
                        // Highlighting for double-clicked model/regulation (works in both views)
                        // In Regulation view: highlight if row matches highlightedRegulation OR cell contains highlightedModel
                        // In Model view: highlight if row matches highlightedModel OR cell contains highlightedRegulation
                        (viewMode === "Regulation" && highlightedRegulation && rowId === highlightedRegulation) ||
                          (viewMode === "Model" && highlightedModel && rowId === highlightedModel) ||
                          (viewMode === "Regulation" && highlightedModel && values.includes(highlightedModel)) ||
                          (viewMode === "Model" && highlightedRegulation && values.includes(highlightedRegulation))
                          ? "bg-violet-100"
                          : "",
                        // Validation Error Styling (only if not highlighted)
                        !highlightedModel && !highlightedRegulation && viewMode === "Regulation" && values.some((v: string) => (rowCounts[v] || 0) > 1)
                          ? "bg-red-100"
                          : "",
                        isEditable
                          ? ""
                          : onCellClick
                            ? "cursor-pointer hover:bg-blue-50"
                            : "",
                        isOver ? "ring-2 ring-blue-400 bg-blue-50" : "",
                      ].join(" ")}
                      onClick={() => {
                        if (!isEditable) {
                          onCellClick?.(rowId, values);
                          return;
                        }
                        if (!editing) startEdit(key, displayValue);
                      }}
                      onDragOver={(e) => {
                        if (!isEditable) return;
                        e.preventDefault();
                        setDragOverKey(key);
                      }}
                      onDragLeave={() => setDragOverKey(null)}
                      onDrop={(e) => {
                        if (!isEditable) return;
                        e.preventDefault();
                        setDragOverKey(null);
                        const raw = e.dataTransfer.getData("application/json");
                        if (!raw) return;
                        try {
                          const payload = JSON.parse(raw);

                          if (payload.type === 'model' && payload.name) {
                            e.stopPropagation(); // Prevent container from catching it
                            onAddModelToCell?.(rowId, fy.label, m, payload.name);
                            return;
                          }

                          const { val, sourceKey } = payload;
                          if (sourceKey && val) moveCellValues(sourceKey, key, val);
                        } catch (err) { }
                      }}
                    >
                      {isEditable && editing ? (
                        <input
                          autoFocus
                          className="w-full h-full px-2 py-2 text-left bg-white outline-none font-medium"
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          placeholder="-"
                        />
                      ) : (
                        <div className="px-2 py-2 flex flex-wrap items-center gap-1 min-h-[40px] relative">
                          {/* Duplicate Warning Icon */}
                          {viewMode === "Regulation" && values.some((v: string) => (rowCounts[v] || 0) > 1) && (
                            <div className="absolute top-0.5 right-0.5  group/info">
                              <Info className="w-3 h-3 text-red-500 cursor-help z-[29]" />
                              <div className="hidden group-hover/info:block absolute bottom-full right-0 mb-1 bg-gray-900 text-white text-xs rounded shadow-xl px-3 py-2 whitespace-nowrap pointer-events-none z-[9999]">
                                ⚠️ Model is already in this Regulation
                              </div>
                            </div>
                          )}

                          {/* Deadline Violation Warning */}
                          {viewMode === "Regulation" && firstDeadlineGlobalIdx !== null && (
                            () => {
                              // Find current global index
                              const qIdx = QUARTERS.findIndex(qi => qi.label === q.label);
                              const mIdxInQ = q.months.indexOf(m);
                              const currentGlobalIdx = yearIdx * 12 + qIdx * 3 + mIdxInQ;

                              if (currentGlobalIdx > firstDeadlineGlobalIdx && values.some((v: string) => isModel(v))) {
                                return (
                                  <div className="absolute top-0.5 left-0.5 group/deadline">
                                    <Info className="w-3 h-3 text-orange-500 cursor-help z-[29]" />
                                    <div className="hidden group-hover/deadline:block absolute bottom-full left-0 mb-1 bg-gray-900 text-white text-xs rounded shadow-xl px-3 py-2 whitespace-nowrap pointer-events-none z-[9999]">
                                      ⚠️ Model cannot come after the first deadline
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }
                          )()}

                          {values.map((v: string, i: number) => {
                            let styles: React.CSSProperties = {};
                            let classes = "text-black";

                            if (SPECIAL_VALUES.includes(v)) {
                              classes = "bg-red-500 text-white";
                            } else if (v.length > 0) {
                              // Use custom color if set
                              styles.backgroundColor = itemColors[v] || stringToColor(v);
                              classes = "text-gray-900";
                            } else {
                              classes = "bg-gray-200 text-black";
                            }

                            return (
                              <span
                                key={i}
                                className={`${classes} px-2 py-1 rounded text-[10px] font-bold shadow-sm whitespace-nowrap cursor-grab active:cursor-grabbing hover:ring-2 ring-offset-1 ring-blue-400`}
                                style={styles}
                                draggable={isEditable}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("application/json", JSON.stringify({ val: v, sourceKey: key }));
                                  e.stopPropagation();
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {v}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
    </tr >
  );
};

const PlanningGrid: React.FC<PlanningGridProps> = ({
  viewMode,
  rowIds,
  cellData,
  isEditable = false,
  onCellChange,
  onCellClick,
  highlightRow,
  financialYears = DEFAULT_FINANCIAL_YEARS,
  onDeleteYear,
  onDeleteRow,
  onRowReorder,
  layout,
  onLayoutChange,
  viewResolution = "Month",
  onRenameRow,
  onAddRegulationFromDrag,
  onAddModelToCell,
  highlightedModel,
  highlightedRegulation,
  itemColors,
}) => {
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [draftValue, setDraftValue] = React.useState("");

  const [armedDragKey, setArmedDragKey] = React.useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = React.useState<string | null>(null);

  // -- Resize State --
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  // Sync if external layout changes (e.g. loading a draft)
  useEffect(() => {
    if (layout) {
      setColWidths(layout.colWidths || {});
      setRowHeights(layout.rowHeights || {});
    }
  }, [layout]);

  const resizing = useRef<{
    type: "col" | "row" | "year" | "quarter";
    id: string;
    startPos: number;
    startSize: number;
    subKeys?: string[];
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;

      const { type, id, startPos, startSize, subKeys } = resizing.current;

      if (type === "row") {
        const diff = e.clientY - startPos;
        const newHeight = Math.max(30, startSize + diff);
        setRowHeights((prev) => ({ ...prev, [id]: newHeight }));
      }
      else if (type === "year" && subKeys) {
        const diff = e.clientX - startPos;
        const newTotalWidth = Math.max(subKeys.length * 30, startSize + diff);
        const newPartWidth = newTotalWidth / subKeys.length;
        const updates: Record<string, number> = {};
        subKeys.forEach(k => updates[k] = newPartWidth);
        setColWidths(prev => ({ ...prev, ...updates }));
      }
      else if (type === "quarter" && subKeys) {
        const diff = e.clientX - startPos;
        const newTotalWidth = Math.max(subKeys.length * 30, startSize + diff);
        const newPartWidth = newTotalWidth / subKeys.length;
        const updates: Record<string, number> = {};
        subKeys.forEach(k => updates[k] = newPartWidth);
        setColWidths(prev => ({ ...prev, ...updates }));
      }
      else {
        const diff = e.clientX - startPos;
        const newWidth = Math.max(30, startSize + diff);
        setColWidths((prev) => ({ ...prev, [id]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      if (resizing.current) {
        resizing.current = null;
        document.body.style.cursor = "default";
        onLayoutChange?.(colWidths, rowHeights);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [colWidths, rowHeights, onLayoutChange]);

  const handleGroupResizeStart = (
    e: React.MouseEvent,
    type: "year" | "quarter",
    id: string,
    subKeys: string[]
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Fix: Determine default width based on the current view resolution
    let defaultWidth = 72; // Month view default
    if (viewResolution === "Quarter") defaultWidth = 120;
    else if (viewResolution === "Year") defaultWidth = 200;

    const currentTotal = subKeys.reduce((acc, k) => acc + (colWidths[k] || defaultWidth), 0);
    resizing.current = {
      type,
      id,
      startPos: e.clientX,
      startSize: currentTotal,
      subKeys
    };
    document.body.style.cursor = "col-resize";
  };

  const handleColResizeStart = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = {
      type: "col",
      id: colId,
      startPos: e.clientX,
      startSize: currentWidth,
    };
    document.body.style.cursor = "col-resize";
  };

  const handleRowResizeStart = (e: React.MouseEvent, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Default height is implicit, but we need a starting point. 
    // We can assume current <tr> clientHeight or a default if not set.
    // Ideally we pass the current rendered height back, but for now lets try to read it from event target parent
    const tr = (e.currentTarget.parentElement?.parentElement?.parentElement as HTMLElement);
    // e.currentTarget is div -> td -> tr.
    // Actually the handle is inside <td> -> <div>. 
    // hierarchy: td > div (flex) > resizer. 
    // hierarchy DraggableRow: td > div (containing resizer). 
    // We want the tr height.
    const currentHeight = rowHeights[rowId] || (e.currentTarget.closest('tr')?.clientHeight ?? 40);

    resizing.current = {
      type: "row",
      id: rowId,
      startPos: e.clientY,
      startSize: currentHeight,
    };
    document.body.style.cursor = "row-resize";
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const commitEdit = () => {
    if (!editingKey) return;
    const [rowId, year, monthStr] = editingKey.split("|");
    onCellChange?.(rowId, year, Number(monthStr), draftValue);
    setEditingKey(null);
  };

  const cancelEdit = () => setEditingKey(null);

  const startEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setDraftValue(currentValue);
    setArmedDragKey(null);
  };

  const moveCellValues = (fromKey: string, toKey: string, value: string) => {
    if (fromKey === toKey) return;

    const fromVals = cellData[fromKey] || [];
    const toVals = cellData[toKey] || [];

    // Remove specific value from source
    const newFromVals = fromVals.filter(v => v !== value);
    // Add to dest (avoid dupe)
    const newToVals = Array.from(new Set([...toVals, value]));

    const [toRow, toYear, toMonthStr] = toKey.split("|");
    const [fromRow, fromYear, fromMonthStr] = fromKey.split("|");

    onCellChange?.(toRow, toYear, Number(toMonthStr), newToVals.join(", "));
    onCellChange?.(fromRow, fromYear, Number(fromMonthStr), newFromVals.join(", "));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id && onRowReorder) {
      const oldIndex = rowIds.indexOf(active.id as string);
      const newIndex = rowIds.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        onRowReorder(arrayMove(rowIds, oldIndex, newIndex));
      }
    }
  };

  // ✅ only allow reorder when:
  // - handler is provided
  // - AND we are in Regulation view (rows represent regs)
  const isDraggable = !!onRowReorder && viewMode === "Regulation";

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        className="excel-container custom-scrollbar shadow-inner h-full overflow-auto"
        onDragOver={(e) => {
          if (isEditable) e.preventDefault();
        }}
        onDrop={(e) => {
          if (!isEditable) return;
          e.preventDefault();
          const raw = e.dataTransfer.getData("application/json");
          if (!raw) return;
          try {
            const payload = JSON.parse(raw);
            if (payload.type === 'regulation' && payload.name) {
              onAddRegulationFromDrag?.(payload.name);
            }
          } catch (err) { }
        }}
      >
        <table className="excel-table text-black">
          <colgroup>
            <col
              style={{
                width: colWidths["first-col"] ? `${colWidths["first-col"]}px` : "180px",
                minWidth: "50px",
              }}
            />
            {financialYears.map((fy) => {
              if (viewResolution === "Year") {
                const width = colWidths[fy.label] || 200;
                return (
                  <col
                    key={fy.label}
                    style={{
                      width: `${width}px`,
                      minWidth: `${width}px`,
                      maxWidth: `${width}px`
                    }}
                  />
                );
              }
              if (viewResolution === "Quarter") {
                return QUARTERS.map(q => {
                  const key = `${fy.label}-${q.label}`;
                  const width = colWidths[key] || 120;
                  return (
                    <col
                      key={key}
                      style={{
                        width: `${width}px`,
                        minWidth: `${width}px`,
                        maxWidth: `${width}px`
                      }}
                    />
                  );
                });
              }
              return QUARTERS.map((q) =>
                q.months.map((m) => {
                  const key = `${fy.label}-${m}`;
                  const width = colWidths[key] || 72;
                  return (
                    <col
                      key={key}
                      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                    />
                  );
                })
              );
            })}
          </colgroup>

          <thead>
            <tr className="h-6">
              <th
                rowSpan={3}
                className="sticky-corner border-r-2 border-gray-300 font-bold text-blue-900 z-50"
                style={
                  colWidths["first-col"]
                    ? {
                      width: `${colWidths["first-col"]}px`,
                      minWidth: `${colWidths["first-col"]}px`,
                      maxWidth: `${colWidths["first-col"]}px`,
                    }
                    : undefined
                }
              >
                {viewMode === "Regulation" ? "Regulation" : "Model"}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-50"
                  onMouseDown={(e) =>
                    handleColResizeStart(e, "first-col", colWidths["first-col"] || 180)
                  }
                />
              </th>

              {financialYears.map((fy) => (
                <th
                  key={fy.label}
                  colSpan={viewResolution === "Year" ? 1 : viewResolution === "Quarter" ? 4 : 12} // 12 months, or 4 quarters, or 1 year
                  className="sticky-top sticky-top-0 border-r-2 border-gray-300 font-bold text-blue-900 group relative"
                >
                  <div className="flex items-center justify-between w-full h-full px-2">
                    <span className="flex-grow text-center">{fy.label}</span>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-50 transition-colors"
                      onMouseDown={(e) => {
                        let subKeys: string[] = [];
                        if (viewResolution === "Year") subKeys = [fy.label];
                        else if (viewResolution === "Quarter") subKeys = QUARTERS.map(q => `${fy.label}-${q.label}`);
                        else subKeys = QUARTERS.flatMap(q => q.months.map(m => `${fy.label}-${m}`));
                        handleGroupResizeStart(e, "year", fy.label, subKeys);
                      }}
                    />
                    {isEditable && onDeleteYear && (
                      <button
                        onClick={() => onDeleteYear(fy.label)}
                        className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Year (Maintains 3-year window)"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>

            {viewResolution !== "Year" && (
              <tr className="h-6">
                {financialYears.map((fy) => (
                  <React.Fragment key={`${fy.label}-q`}>
                    {QUARTERS.map((q) => (
                      <th
                        key={`${fy.label}-${q.label}`}
                        colSpan={viewResolution === "Quarter" ? 1 : 3}
                        className="sticky-top sticky-top-1 border-r border-gray-300 font-bold text-blue-900 relative"
                      >
                        <div className="flex items-center justify-center w-full h-full px-1">
                          {q.label}
                        </div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-50 transition-colors"
                          onMouseDown={(e) => {
                            let subKeys: string[] = [];
                            if (viewResolution === "Quarter") subKeys = [`${fy.label}-${q.label}`];
                            else subKeys = q.months.map(m => `${fy.label}-${m}`);
                            handleGroupResizeStart(e, "quarter", `${fy.label}-${q.label}`, subKeys);
                          }}
                        />
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            )}

            {viewResolution === "Month" && (
              <tr className="h-6">
                {financialYears.map((fy) => (
                  <React.Fragment key={`${fy.label}-m`}>
                    {QUARTERS.map((q) => (
                      <React.Fragment key={`${fy.label}-${q.label}-months`}>
                        {q.months.map((m) => (
                          <th
                            key={`${fy.label}-${m}`}
                            className="sticky-top sticky-top-2 month-col text-[10px] font-medium text-blue-900 relative"
                          >
                            <div className="flex items-center justify-center w-full h-full">
                              {MONTH_LABELS[m]}
                            </div>
                            <div
                              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-50 transition-colors"
                              onMouseDown={(e) => {
                                const key = `${fy.label}-${m}`;
                                const currentW = colWidths[key] || 72; // ✅ Default to 72
                                handleColResizeStart(e, key, currentW);
                              }}
                            />
                          </th>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            )}
          </thead>

          <tbody>
            <SortableContext
              items={rowIds}
              strategy={verticalListSortingStrategy}
              disabled={!isDraggable}
            >
              {rowIds.map((rowId) => (
                <DraggableRow
                  key={rowId}
                  rowId={rowId}
                  financialYears={financialYears}
                  cellData={cellData}
                  isEditable={isEditable}
                  highlightRow={highlightRow}
                  onCellClick={onCellClick}
                  onCellChange={onCellChange}
                  onDeleteRow={onDeleteRow}
                  editingKey={editingKey}
                  startEdit={startEdit}
                  isCellEditing={(key: string) => editingKey === key}
                  draftValue={draftValue}
                  setDraftValue={setDraftValue}
                  commitEdit={commitEdit}
                  cancelEdit={cancelEdit}
                  armedDragKey={armedDragKey}
                  setArmedDragKey={setArmedDragKey}
                  dragOverKey={dragOverKey}
                  setDragOverKey={setDragOverKey}
                  moveCellValues={moveCellValues}
                  isDraggable={isDraggable}
                  height={rowHeights[rowId]}
                  onRowResizeStart={handleRowResizeStart}
                  firstColWidth={colWidths["first-col"]}
                  viewResolution={viewResolution}
                  onRenameRow={onRenameRow}
                  onAddModelToCell={onAddModelToCell}
                  viewMode={viewMode}
                  highlightedModel={highlightedModel}
                  highlightedRegulation={highlightedRegulation}
                  itemColors={itemColors}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
};

export default PlanningGrid;
