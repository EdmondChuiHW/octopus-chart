import './PredictionToggle.css';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  loading?: boolean;
};

export default function PredictionToggle({
  checked,
  onChange,
  loading,
}: Props) {
  return (
    <label className="prediction-toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={loading}
        onChange={(e) => onChange(e.target.checked)}
      />
      {loading ? <span className="spinner" /> : '🔮'} Show predictions
    </label>
  );
}
