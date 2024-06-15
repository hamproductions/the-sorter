import { useEffect, useState } from 'react';
import type { HTMLStyledProps } from 'styled-system/types';
import { styled } from 'styled-system/jsx';
import type { Character } from '~/types';
import { getPicUrl } from '~/utils/assets';
import { getFullName } from '~/utils/character';
import type { Locale } from '~/i18n';

export function CharacterIcon(
  props: HTMLStyledProps<'img'> & { character: Character; locale: Locale }
) {
  const { character, locale, ...rest } = props;
  const [isError, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [character.id]);

  if (isError || !character.hasIcon) return null;

  return (
    <styled.img
      src={getPicUrl(character.id, 'icons')}
      alt={`${getFullName(character, locale)} Icon`}
      onError={(e) => {
        e.preventDefault();
        setError(true);
      }}
      {...rest}
    />
  );
}
