import { Button, InputGroup, Menu, MenuItem, Popover } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { fontEffectDefinitions, type GroupEffect } from '../../effects';
import { fontStore } from '../../store/fontStore';
import styles from '../FontProperties.module.css';
import { EffectOpacityRow, EffectRow } from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

export const GroupEffectEditor = observer(function GroupEffectEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
  renderChildren,
}: EffectEditorProps<GroupEffect>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title={effect.name.trim() || 'Group'}
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectRow label="Name">
        <InputGroup
          small
          value={effect.name}
          onChange={(e) => {
            fontStore.setEffectProperty(effect, 'name', e.target.value, 'Group name');
          }}
          placeholder="Group"
        />
      </EffectRow>
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Group opacity');
        }}
      />
      <div className={styles.groupSectionHeader}>
        <span className={styles.effectTitle}>Children</span>
        <Popover
          content={
            <Menu>
              {fontEffectDefinitions.map((definition) => (
                <MenuItem
                  key={definition.type}
                  icon={definition.icon}
                  text={definition.label}
                  onClick={() => {
                    fontStore.addEffectToGroup(definition.type, effect.id);
                  }}
                />
              ))}
            </Menu>
          }
          placement="bottom-end"
        >
          <Button small icon="plus" aria-label="Add child effect" />
        </Popover>
      </div>
      {renderChildren?.(effect.children, depth + 1, effect.id)}
    </EffectEditorFrame>
  );
});
