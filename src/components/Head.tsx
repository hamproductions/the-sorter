import ReactDOM from 'react-dom';

export const Head = ({ children }: { children: React.ReactNode }) => {
  return ReactDOM.createPortal(children, document.head);
};
