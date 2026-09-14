import { createContext, useContext } from 'react';

export const CommandContext = createContext<{
    busy: boolean;
    execute: (work: () => Promise<void>) => Promise<boolean>;
}>({ busy: false, execute: async () => false });

export function useCommand() { return useContext(CommandContext); }
