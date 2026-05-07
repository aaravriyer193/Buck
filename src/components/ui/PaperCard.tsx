import { cn } from '@/lib/utils';

interface PaperCardProps extends React.HTMLAttributes<HTMLDivElement> {
  flat?: boolean;
  ruled?: boolean;
}

export function PaperCard({ flat, ruled, className, children, ...rest }: PaperCardProps) {
  return (
    <div
      className={cn(
        flat ? 'paper-card-flat' : 'paper-card',
        ruled && 'ruled',
        'p-6',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
