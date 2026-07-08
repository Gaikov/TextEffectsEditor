import { observer } from 'mobx-react-lite';
import {
  Button,
  Checkbox,
  ControlGroup,
  HTMLSelect,
  InputGroup,
  Icon,
  NumericInput,
  Popover,
  MenuItem,
  Spinner,
} from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import { fontStore } from '../store/fontStore';
import styles from './FontProperties.module.css';

const getFontName = (item: { name: string }) => item.name;

const CHECKBOX_STYLE: React.CSSProperties = {
  margin: 0,
};

interface Props {
  fontList: string[];
  fontsLoaded: boolean;
}

export default observer(function FontProperties({ fontList, fontsLoaded }: Props) {
  const intent = fontStore.fontValid ? undefined : 'danger';
  const fontItems = fontList.map((name) => ({ name }));

  return (
    <div className={`${styles.panel} font-properties-panel`}>
      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Text</span>
        <InputGroup
          small
          value={fontStore.text}
          onChange={(e) => fontStore.setText(e.target.value)}
          placeholder="Enter text..."
        />
      </div>

      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Font</span>
        <Suggest
          key={fontList.length}
          items={fontItems}
          inputValueRenderer={getFontName}
          closeOnSelect={false}
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
              onClick={handleClick}
              multiline
            />
          )}
          onItemSelect={(item) => fontStore.setFontFamily(item.name)}
          selectedItem={{ name: fontStore.fontFamily }}
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
          small
          value={fontStore.boldWeight}
          onChange={(e) => fontStore.setBoldWeight(Number(e.target.value))}
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
          onValueChange={fontStore.setFontSize}
          min={1}
          max={2048}
          clampValueOnBlur
          fill
          buttonPosition="none"
        />
      </div>

      <div className={styles.propertyRow}>
        <span className={styles.propertyLabel}>Color</span>
        <ControlGroup fill>
          <Popover
            content={
              <div style={{ padding: 8 }}>
                <input
                  type="color"
                  value={fontStore.fontColor}
                  onChange={(e) => fontStore.setFontColor(e.target.value)}
                />
              </div>
            }
          >
            <Button
              minimal
              small
              style={{
                width: 30,
                minWidth: 30,
                background: fontStore.fontColor,
                borderRadius: '3px 0 0 3px',
              }}
            />
          </Popover>
          <InputGroup
            small
            value={fontStore.fontColor}
            onChange={(e) => fontStore.setFontColor(e.target.value)}
            placeholder="#10161A"
            fill
          />
        </ControlGroup>
      </div>
    </div>
  );
});
