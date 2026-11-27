import { useTranslation } from 'react-i18next';
import { FaEllipsis } from 'react-icons/fa6';
import { ExportMenu, ExportMenuGroup, ExportMenuItem, type ActionItem } from './ExportMenu';
import { IconButton } from '~/components/ui/icon-button';

export function MoreMenu({ items }: { items: ActionItem[] }) {
  const { t } = useTranslation();

  return (
    <ExportMenu
      placement="bottom-end"
      trigger={
        <IconButton
          variant="subtle"
          aria-label={t('results.more')}
          w={{ base: '11', sm: '10' }}
          h={{ base: '11', sm: '10' }}
        >
          <FaEllipsis />
        </IconButton>
      }
    >
      <ExportMenuGroup label={t('results.more')}>
        {items.map((item) => (
          <ExportMenuItem
            key={item.id}
            value={item.id}
            onClick={item.onSelect}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </ExportMenuGroup>
    </ExportMenu>
  );
}
