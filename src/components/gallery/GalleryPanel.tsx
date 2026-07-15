import { Button, SegmentedControl } from '@blueprintjs/core';
import type { GalleryItem, GalleryProviderId } from '../../gallery/GalleryProvider';
import type { CheckerboardTheme } from '../../viewPreferences';
import GalleryContent from './GalleryContent';
import styles from './GalleryPanel.module.css';

interface GalleryPanelProps {
  activeTab: GalleryProviderId;
  canModerate?: boolean;
  checkerboardTheme: CheckerboardTheme;
  isLoading: boolean;
  isOpen: boolean;
  items: GalleryItem[];
  query: string;
  width: number;
  onAdd: () => void;
  onApply: (item: GalleryItem) => void;
  onApprove: (id: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onOpen: () => void;
  onQueryChange: (query: string) => void;
  onReject: (id: string) => void;
  onSetCheckerboardTheme: (theme: CheckerboardTheme) => void;
  onTabChange: (tab: GalleryProviderId) => void;
}

export default function GalleryPanel({
  activeTab,
  canModerate = false,
  checkerboardTheme,
  isLoading,
  isOpen,
  items,
  query,
  width,
  onAdd,
  onApply,
  onApprove,
  onClose,
  onDelete,
  onOpen,
  onQueryChange,
  onReject,
  onSetCheckerboardTheme,
  onTabChange,
}: GalleryPanelProps) {
  if (!isOpen) {
    return (
      <div className={styles.rail}>
        <Button
          minimal
          small
          icon="panel-table"
          title="Show Gallery"
          aria-label="Show Gallery"
          onClick={onOpen}
        />
      </div>
    );
  }

  return (
    <aside className={styles.panel} style={{ width, flexBasis: width }}>
      <div className={styles.header}>
        <div className={styles.title}>Gallery</div>
        <div className={styles.headerActions}>
          <Button
            small
            minimal
            icon={activeTab === 'global' ? 'cloud-upload' : 'add-to-artifact'}
            text="Add"
            title={`Add To ${activeTab === 'global' ? 'Global' : 'Local'} Gallery`}
            aria-label={`Add To ${activeTab === 'global' ? 'Global' : 'Local'} Gallery`}
            onClick={onAdd}
          />
          <Button
            small
            minimal
            icon="chevron-left"
            title="Hide Gallery"
            aria-label="Hide Gallery"
            onClick={onClose}
          />
        </div>
      </div>
      <SegmentedControl
        fill
        small
        value={activeTab}
        onValueChange={(value) => onTabChange(value as GalleryProviderId)}
        options={[
          { label: 'Global', value: 'global' },
          { label: 'Local', value: 'local' },
        ]}
      />
      <div className={styles.content}>
        <GalleryContent
          canModerate={canModerate && activeTab === 'global'}
          checkerboardTheme={checkerboardTheme}
          isLoading={isLoading}
          items={items}
          query={query}
          onApply={onApply}
          onApprove={onApprove}
          onDelete={onDelete}
          onQueryChange={onQueryChange}
          onReject={onReject}
          onSetCheckerboardTheme={onSetCheckerboardTheme}
        />
      </div>
    </aside>
  );
}
