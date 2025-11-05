import type { FormEvent } from 'react';

type Props = {
  product: string;
  tariff: string;
  setProduct: (s: string) => void;
  setTariff: (s: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
};

export default function Controls({
  product,
  tariff,
  setProduct,
  setTariff,
  onSubmit,
  isLoading,
}: Props) {
  return (
    <form className="controls" onSubmit={onSubmit}>
      <label>
        Product
        <input
          aria-label="product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
      </label>
      <label>
        Tariff code
        <input
          aria-label="tariff"
          value={tariff}
          onChange={(e) => setTariff(e.target.value)}
        />
      </label>
      <button type="submit" className="btn" disabled={isLoading}>
        {isLoading ? 'Loading…' : 'Load rates'}
      </button>
    </form>
  );
}
