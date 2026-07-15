import { useMemo, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import {
  closestCorners,
  pointerWithin,
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Button,
  Checkbox,
  HTMLSelect,
  InputGroup,
  Icon,
  Menu,
  Popover,
  MenuItem,
  Spinner,
} from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import { fontEffectDefinitions, type IFontEffect } from '../effects';
import { fontStore } from '../store/fontStore';
import { getEffectEditor } from './effects/effectEditorRegistry';
import NumberInput from './NumberInput';
import styles from './FontProperties.module.css';

interface FontItem {
  name: string;
}

const getFontName = (item: FontItem) => item.name;

const CHECKBOX_STYLE: React.CSSProperties = {
  margin: 0,
};

const ICON_BUTTON_STYLE: React.CSSProperties = {
  minWidth: 24,
};

const ROOT_PARENT_ID = null;
const EFFECT_LIST_ID_PREFIX = 'effect-list:';
const EFFECT_INSERT_ID_PREFIX = 'effect-insert:';

interface Props {
  fontList: string[];
  fontsLoaded: boolean;
  onClose: () => void;
  width: number;
}

interface EffectDragData {
  kind: 'effect';
  effect: IFontEffect;
  parentId: string | null;
  index: number;
}

interface EffectListDragData {
  kind: 'effect-list';
  parentId: string | null;
  count: number;
}

interface EffectInsertDropData {
  kind: 'effect-insert';
  parentId: string | null;
  index: number;
}

type EffectDropData = EffectDragData | EffectListDragData | EffectInsertDropData;

type RenderEffects = (
  effects: IFontEffect[],
  depth: number,
  parentId: string | null,
) => ReactNode;

function getEffectListId(parentId: string | null) {
  return `${EFFECT_LIST_ID_PREFIX}${parentId ?? 'root'}`;
}

function getEffectInsertId(parentId: string | null, index: number) {
  return `${EFFECT_INSERT_ID_PREFIX}${parentId ?? 'root'}:${index}`;
}

const effectTreeCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const collisions = pointerCollisions.length > 0
    ? pointerCollisions
    : closestCorners(args);

  const sortedCollisions = [...collisions].sort((a, b) => {
    const aRect = args.droppableRects.get(a.id);
    const bRect = args.droppableRects.get(b.id);
    const aArea = aRect ? aRect.width * aRect.height : Number.MAX_SAFE_INTEGER;
    const bArea = bRect ? bRect.width * bRect.height : Number.MAX_SAFE_INTEGER;
    return aArea - bArea;
  });
  const inserts = sortedCollisions.filter(
    (collision) =>
      getDropData(collision.data?.droppableContainer.data.current)?.kind ===
      'effect-insert',
  );
  if (inserts.length > 0) return inserts;

  const effects = sortedCollisions.filter(
    (collision) =>
      getDropData(collision.data?.droppableContainer.data.current)?.kind ===
      'effect',
  );
  if (effects.length > 0) return effects;

  return sortedCollisions;
};

function getDropData(value: unknown): EffectDropData | undefined {
  if (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    (value.kind === 'effect' ||
      value.kind === 'effect-list' ||
      value.kind === 'effect-insert')
  ) {
    return value as EffectDropData;
  }

  return undefined;
}

function getTargetIndexFromEffect(event: DragEndEvent, overIndex: number) {
  const translatedRect = event.active.rect.current.translated;
  const activeCenterY = translatedRect
    ? translatedRect.top + translatedRect.height / 2
    : event.over!.rect.top;
  const overMiddleY = event.over!.rect.top + event.over!.rect.height / 2;
  return overIndex + (activeCenterY > overMiddleY ? 1 : 0);
}

function EffectInsertDropZone({
  parentId,
  index,
}: {
  parentId: string | null;
  index: number;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: getEffectInsertId(parentId, index),
    data: {
      kind: 'effect-insert',
      parentId,
      index,
    } satisfies EffectInsertDropData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.effectInsertDropZone} ${
        isOver ? styles.effectInsertDropZoneOver : ''
      }`}
    />
  );
}

function EmptyEffectDropTarget({
  parentId,
}: {
  parentId: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: getEffectInsertId(parentId, 0),
    data: {
      kind: 'effect-insert',
      parentId,
      index: 0,
    } satisfies EffectInsertDropData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.emptyDropTarget} ${
        isOver ? styles.emptyDropTargetOver : ''
      }`}
    >
      Drop effects here
    </div>
  );
}

const SortableEffectEditor = observer(function SortableEffectEditor({
  effect,
  index,
  count,
  depth,
  parentId,
  renderChildren,
}: {
  effect: IFontEffect;
  index: number;
  count: number;
  depth: number;
  parentId: string | null;
  renderChildren: RenderEffects;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
  } = useSortable({
    id: effect.id,
    data: {
      kind: 'effect',
      effect,
      parentId,
      index,
    } satisfies EffectDragData,
  });
  const EffectEditor = getEffectEditor(effect);

  return (
    <div
      ref={setNodeRef}
      className={`${styles.sortableEffect} ${
        isDragging ? styles.draggingEffect : ''
      }`}
    >
      <EffectEditor
        effect={effect}
        index={index}
        count={count}
        depth={depth}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        renderChildren={renderChildren}
      />
    </div>
  );
});

const EffectList = observer(function EffectList({
  effects,
  depth,
  parentId,
  renderChildren,
}: {
  effects: IFontEffect[];
  depth: number;
  parentId: string | null;
  renderChildren: RenderEffects;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: getEffectListId(parentId),
    data: {
      kind: 'effect-list',
      parentId,
      count: effects.length,
    } satisfies EffectListDragData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.effectList} ${
        parentId === ROOT_PARENT_ID ? styles.effectListRoot : ''
      } ${isOver ? styles.effectListOver : ''}`}
    >
      <SortableContext
        items={effects.map((effect) => effect.id)}
        strategy={verticalListSortingStrategy}
      >
        {effects.map((effect, index) => (
          <div key={effect.id}>
            <EffectInsertDropZone parentId={parentId} index={index} />
            <SortableEffectEditor
              effect={effect}
              index={index}
              count={effects.length}
              depth={depth}
              parentId={parentId}
              renderChildren={renderChildren}
            />
          </div>
        ))}
      </SortableContext>
      {effects.length > 0 && (
        <EffectInsertDropZone parentId={parentId} index={effects.length} />
      )}
      {effects.length === 0 && (
        <EmptyEffectDropTarget parentId={parentId} />
      )}
    </div>
  );
});

export default observer(function FontProperties({
  fontList,
  fontsLoaded,
  onClose,
  width,
}: Props) {
  fontStore.effectsVersion;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );
  const intent = fontStore.fontValid ? undefined : 'danger';
  const fontItems = useMemo(() => fontList.map((name) => ({ name })), [fontList]);
  const selectedFontItem =
    fontItems.find((item) => item.name === fontStore.fontFamily) ?? {
      name: fontStore.fontFamily,
    };
  const renderEffects: RenderEffects = (effects, depth, parentId) => (
    <EffectList
      effects={effects}
      depth={depth}
      parentId={parentId}
      renderChildren={renderEffects}
    />
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;

    const activeData = getDropData(event.active.data.current);
    const overData = getDropData(event.over.data.current);
    if (!activeData || activeData.kind !== 'effect' || !overData) return;

    if (overData.kind === 'effect-list') {
      fontStore.moveEffectToParent(
        activeData.effect.id,
        overData.parentId,
        overData.count,
      );
      return;
    }

    if (overData.kind === 'effect-insert') {
      fontStore.moveEffectToParent(
        activeData.effect.id,
        overData.parentId,
        overData.index,
      );
      return;
    }

    if (overData.effect.id === activeData.effect.id) return;

    fontStore.moveEffectToParent(
      activeData.effect.id,
      overData.parentId,
      getTargetIndexFromEffect(event, overData.index),
    );
  };

  return (
    <div
      className={`${styles.panel} font-properties-panel`}
      style={{ width }}
    >
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Properties</span>
        <Button
          small
          minimal
          icon="chevron-right"
          title="Hide Properties"
          aria-label="Hide Properties"
          onClick={onClose}
        />
      </div>

      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Text</span>
        <InputGroup
          small
          value={fontStore.text}
          onChange={(e) => {
            fontStore.setRootProperty('text', e.target.value, 'Text');
          }}
          placeholder="Enter text..."
        />
      </div>

      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Font</span>
        <Suggest
          key={fontList.length}
          activeItem={selectedFontItem}
          items={fontItems}
          itemsEqual="name"
          inputValueRenderer={getFontName}
          closeOnSelect={false}
          resetOnQuery={false}
          inputProps={{
            small: true,
            intent,
            rightElement: !fontsLoaded ? (
              <Spinner size={14} />
            ) : fontStore.fontValid ? (
              <Icon icon="tick-circle" intent="success" />
            ) : (
              <Icon icon="warning-sign" intent="danger" />
            ),
          }}
          itemPredicate={(query, item) =>
            item.name.toLowerCase().includes(query.toLowerCase())
          }
          itemRenderer={(item, { handleClick, modifiers }) => (
            <MenuItem
              key={item.name}
              text={item.name}
              active={modifiers.active}
              selected={item.name === fontStore.fontFamily}
              icon={item.name === fontStore.fontFamily ? 'tick' : 'blank'}
              onClick={handleClick}
              multiline
            />
          )}
          onItemSelect={(item) => {
            fontStore.setRootProperty('fontFamily', item.name, 'Font');
          }}
          selectedItem={selectedFontItem}
          popoverProps={{ matchTargetWidth: false, minimal: false }}
          noResults={<MenuItem disabled text="No results." />}
        />
      </div>

      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Italic</span>
        <Checkbox
          checked={fontStore.italic}
          onChange={fontStore.toggleItalic}
          style={CHECKBOX_STYLE}
        />
      </div>

      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Bold</span>
        <HTMLSelect
          fill
          minimal
          value={fontStore.boldWeight}
          onChange={(e) => {
            fontStore.setRootProperty(
              'boldWeight',
              Number(e.target.value),
              'Bold weight',
            );
          }}
          options={[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => ({
            value: w,
            label: String(w),
          }))}
        />
      </div>

      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Size</span>
        <NumberInput
          small
          value={fontStore.fontSize}
          onChange={(value) => {
            fontStore.setRootProperty('fontSize', value, 'Font size');
          }}
          min={1}
          max={2048}
          allowFloat
          fill
        />
      </div>

      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Effects</span>
        <Popover
          content={
            <Menu>
              {fontEffectDefinitions.map((definition) => (
                <MenuItem
                  key={definition.type}
                  icon={definition.icon}
                  text={definition.label}
          onClick={() => fontStore.addEffectToGroup(definition.type)}
                />
              ))}
            </Menu>
          }
          placement="bottom-end"
        >
          <Button
            small
            icon="plus"
            aria-label="Add effect"
            style={ICON_BUTTON_STYLE}
          />
        </Popover>
      </div>

      <DndContext
        collisionDetection={effectTreeCollisionDetection}
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        {renderEffects(fontStore.effects, 0, ROOT_PARENT_ID)}
      </DndContext>
    </div>
  );
});
