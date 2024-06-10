import { HTMLStyledProps } from 'styled-system/types';
import { styled } from 'styled-system/jsx';
import { Character } from '~/types';
import { getPicUrl } from '~/utils/assets';

export const CharacterIcon = (props: HTMLStyledProps<'img'> & { character: Character }) => {
  const { character, ...rest } = props;

  return (
    <styled.img
      src={getPicUrl(character.id, 'icons')}
      onLoad={(e) => ((e.target as HTMLImageElement).style.display = 'block')}
      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
      {...rest}
    />
  );
};
