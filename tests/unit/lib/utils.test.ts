import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils Library', () => {
    describe('cn', () => {
        it('should merge class names correctly', () => {
            const result = cn('class1', 'class2');
            expect(result).toBe('class1 class2');
        });

        it('should handle conditional classes', () => {
            const result = cn('class1', true && 'class2', false && 'class3');
            expect(result).toBe('class1 class2');
        });

        it('should handle arrays of classes', () => {
            const result = cn(['class1', 'class2']);
            expect(result).toBe('class1 class2');
        });

        it('should handle objects of classes', () => {
            const result = cn({ class1: true, class2: false, class3: true });
            expect(result).toBe('class1 class3');
        });

        it('should merge tailwind classes correctly', () => {
            const result = cn('p-4', 'p-2');
            expect(result).toBe('p-2');
        });

        it('should handle complex combinations', () => {
            const result = cn('text-red-500', 'bg-blue-500', { 'text-green-500': true });
            expect(result).toBe('bg-blue-500 text-green-500');
        });
    });
});
