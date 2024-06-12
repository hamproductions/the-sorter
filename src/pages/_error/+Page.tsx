export { Page };

import { usePageContext } from 'vike-react/usePageContext';
/* Or:
import { usePageContext } from 'vike-vue/usePageContext'
import { usePageContext } from 'vike-solid/usePageContext'
*/

function Page() {
  const pageContext = usePageContext();

  console.log(pageContext);

  return <p>Something went wrong lah</p>;
}
