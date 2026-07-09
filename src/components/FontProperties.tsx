import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Checkbox,
  HTMLSelect,
  InputGroup,
  Icon,
  Menu,
  NumericInput,
  Popover,
  MenuItem,
  Spinner,
} from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import { fontEffectDefinitions } from '../effects';
import { fontStore } from '../store/fontStore';
import { getEffectEditor } from './effects/effectEditorRegistry';
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

interface Props {
  fontList: string[];
  fontsLoaded: boolean;
  width: number;
}

export default observer(function FontProperties({
  fontList,
  fontsLoaded,
  width,
}: Props) {
  const intent = fontStore.fontValid ? undefined : 'danger';
  const fontItems = useMemo(() => fontList.map((name) => ({ name })), [fontList]);
  const selectedFontItem =
    fontItems.find((item) => item.name === fontStore.fontFamily) ?? {
      name: fontStore.fontFamily,
    };

  return (
    <div
      className={`${styles.panel} font-properties-panel`}
      style={{ width }}
    >
      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Text</span>
        <InputGroup
          small
          value={fontStore.text}
          onChange={(e) => {
            fontStore.text = e.target.value;
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
            fontStore.fontFamily = item.name;
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
            fontStore.boldWeight = Number(e.target.value);
          }}
          options={[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => ({
            value: w,
            label: String(w),
          }))}
        />
      </div>

      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Size</span>
        <NumericInput
          small
          value={fontStore.fontSize}
          onValueChange={(value) => {
            fontStore.fontSize = value;
          }}
          min={1}
          max={2048}
          clampValueOnBlur
          fill
          buttonPosition="none"
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
                  onClick={() => fontStore.addEffect(definition.type)}
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

      {fontStore.effects.map((effect, index) => {
        const EffectEditor = getEffectEditor(effect);
        return (
          <EffectEditor
            key={effect.id}
            effect={effect}
            index={index}
            count={fontStore.effects.length}
          />
        );
      })}
    </div>
  );
});
