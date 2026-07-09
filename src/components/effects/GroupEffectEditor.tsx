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
      headerActions={
        <Button
          small
          minimal
          icon={effect.collapsed ? 'chevron-right' : 'chevron-down'}
          aria-label={effect.collapsed ? 'Expand group' : 'Collapse group'}
          onClick={() => {
            effect.collapsed = !effect.collapsed;
          }}
        />
      }
    >
      {effect.collapsed ? null : (
        <>
          <EffectRow label="Name">
            <InputGroup
              small
              value={effect.name}
              onChange={(e) => {
                effect.name = e.target.value;
              }}
              placeholder="Group"
            />
          </EffectRow>
          <EffectOpacityRow
            value={effect.opacity}
            onChange={(value) => {
              effect.opacity = value;
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
        </>
      )}
    </EffectEditorFrame>
  );
});
