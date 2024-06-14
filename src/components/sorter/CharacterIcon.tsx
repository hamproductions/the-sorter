import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HTMLStyledProps } from 'styled-system/types';
import { styled } from 'styled-system/jsx';
import { Character } from '~/types';
import { getPicUrl } from '~/utils/assets';
import { getFullName } from '~/utils/character';

export function CharacterIcon(props: HTMLStyledProps<'img'> & { character: Character }) {
  const { i18n } = useTranslation();
  const { character, ...rest } = props;
  const [isError, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [character.id]);

  if (isError || !character.hasIcon) return null;

  return (
    <styled.img
      src={getPicUrl(character.id, 'icons')}
      alt={`${getFullName(character, i18n.language as 'en')} Icon`}
      onError={(e) => {
        e.preventDefault();
        setError(true);
      }}
      {...rest}
    />
  );
}
