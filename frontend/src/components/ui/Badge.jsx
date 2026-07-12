import { STATUS_COLORS } from '../../utils/constants';

const DOT_COLORS = {
  available:  'bg-green-500',
  on_trip:    'bg-blue-500',
  in_shop:    'bg-orange-500',
  retired:    'bg-red-500',
  suspended:  'bg-red-500',
  off_duty:   'bg-gray-400',
  draft:      'bg-gray-400',
  dispatched: 'bg-blue-500',
  completed:  'bg-green-500',
  cancelled:  'bg-red-500',
  active:     'bg-orange-500',
  closed:     'bg-green-500',
};

export default function Badge({ status, label }) {
  const key = STATUS_COLORS[status?.toUpperCase()] || status?.toLowerCase() || 'draft';
  const dot = DOT_COLORS[key] || 'bg-gray-400';
  const display = label || (status?.replace(/_/g, ' ') ?? '');
  return (
    <span className={`badge badge-${key}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {display}
    </span>
  );
}
