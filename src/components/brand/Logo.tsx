import { cn } from '@/lib/utils';
import { Infinity } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <Infinity className="text-blue-500 h-7 w-7" />
    </div>
  );
};

export default Logo;