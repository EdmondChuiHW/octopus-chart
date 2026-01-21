import { ShowMoreList } from './ShowMoreList';

import './RadioForm.css';

type Props = {
  children: React.ReactNode[];
  legend: React.ReactNode;
  initialCount?: number;
};

export default function RadioForm({ children, legend, initialCount }: Props) {
  return (
    <form className="radio-form">
      <fieldset>
        <legend>{legend}</legend>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            alignContent: 'stretch',
          }}
        >
          <ShowMoreList initialCount={initialCount}>{children}</ShowMoreList>
        </div>
      </fieldset>
    </form>
  );
}
